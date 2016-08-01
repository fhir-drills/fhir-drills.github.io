#!/usr/bin/env lua
local lunajson = require("lunajson")
local inspect = require("inspect")

local update_resource_references, get_resource_id, get_resource_type, do_upload, get_current_file
  local server_url

  null_value = function() end
  local decode = function(data)
    return lunajson.decode(data, nil, null_value)
  end
  local encode = function(data)
    return lunajson.encode(data, null_value)
  end


  local files = {
--    {"resource-examples/Patient-f001.json", 
--      type = nil, -- resource type
--      originalid = nil, -- original resource ID
--      uploadedid = nil, -- server-assigned ID
--      content = nil, -- decoded JSON content
--      uploaded = nil, -- true is resource has been uplaoded
--      jsid = nil, -- ID that's been assigned in for use in JS
--    },
--    {"resource-examples/Encounter-f001.json"},
--    {"resource-examples/DiagnosticOrder-f001.json"}, 
--    {"resource-examples/Observation-f001.json"},
--    {"resource-examples/Observation-f002.json"},
--    {"resource-examples/DiagnosticReport-f001.json"}, 
  }

-- keeps track of the resource's original ID and uploaded one
  local id_map = {
    -- ["Patient/digitalhealth-f001"] = "Patient/spark2494"]
  }

-- finds given keys in a table and allows a function
-- to do work on their data
  local find_references
  find_references = function(data, key, f)
    for k,v in pairs(data) do
      if k == key then
        f(data,k,v)
      end

      if type(v) == "table" then
        find_references(v, key, f)
      end
    end
  end

  get_resource_type = function(filecontent)
    return filecontent.resourceType
  end

-- pull out the original ID of the resource and delete it from the resource as well
  get_resource_id = function(filecontent)
    local id = filecontent.id
    filecontent.id = nil

    return id
  end

  upload = function(file)
    local filelocation = file[1]
    local resourcetype = file.type

    local jq = window.jQuery()
    local jqxhr = window.jQuery:ajax(window:makeAjaxPost(string.format('%s/%s', server_url, resourcetype), encode(file.content)))
    jqxhr:done(function() 
        upload_done(decode(jqxhr.responseText))
      end)

    jqxhr:fail(function(_, err)
        print("upload failed: "..err.responseText)
        
        js.global.failedUpload()
      end)
  end

  upload_done = function(result)      
    local resulttype = result.resourceType

    local file = get_current_file()
    local filename = file[1]

    if resulttype == "OperationOutcome" then
      print(string.format("%s: %s", tostring(filename), result.text.div))
      return
    end

    local id = result.id
    file.uploadedid = id
    file.uploaded = true

    id_map[string.format("%s/%s", file.type, file.originalid)] = string.format("%s/%s", file.type, file.uploadedid)
    print(string.format("%s: %s/%s/%s", filename, server_url, file.type, id))

    -- nil is to fix an off by one bug
    js.global.uploadedResource(nil, file.jsid, file.uploadedid, file.type)

    local uploading_next = do_upload()
    if not uploading_next then 
      print"All resources uploaded"
      js.global.completeUpload()
    end

  end


    load_file = function(file)
      local filename = file[1]
      local jqxhr = window.jQuery:ajax(filename)
      jqxhr:done(function() 
          file.content = decode(jqxhr.responseText)

          file.content = update_resource_references(file.content)
          file.originalid = get_resource_id(file.content)
          file.type = get_resource_type(file.content)

          upload(file)
        end)
    end

    update_resource_references = function(content)

      -- replace references in structured content of resource
      find_references(content, "reference", function(data, key, value)
          if id_map[value] then
            data[key] = id_map[value]
          end
        end)

      -- replace references in narrative
      if content.text and content.text.div then
        local narrative = content.text
        for oldid, newid in pairs(id_map) do
          -- escape characters
          narrative.div = narrative.div:gsub(oldid:gsub("([^%w])", "%%%1"), newid)
        end
      end

      return content
    end

    get_current_file = function()
      for _, file in ipairs(files) do
        if not file.uploaded then
          return file
        end
      end
    end

    function upload_all()
      server_url = js.global.uploadServer
      files = {}

      for _, resource_data in js.ipairs(js.global.uploadResources) do        
        files[#files+1] = {resource_data[1], jsid = resource_data[0]}
      end

      do_upload()
      end

      js.global.upload_all = upload_all

      do_upload = function()
          for _, file in ipairs(files) do
            if not file.uploaded then
              -- load this resource's data in
              local filename = file[1]
              print("Uploading "..filename)

              file.content = load_file(file)
              return true
            end
          end

          return false
        end