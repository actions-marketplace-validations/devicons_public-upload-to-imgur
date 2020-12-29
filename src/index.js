const core = require('@actions/core')
const axios = require('axios')
const fs = require('fs')
const search = require("./search")

main()
  .then(() => console.log("Upload Finished."))
  .catch(err => {
    core.setFailed(err);
  })

async function main() {
  const img_paths = await search.findFilesToUpload(core.getInput('path'))
  const description = core.getInput("description")
  const clientId = core.getInput("client_id")

  console.log("Uploading " + img_paths.length + " images...", img_paths)
  if (!img_paths) {
    console.log("No image paths found. Skipping upload and exiting script.")
    return;
  }

  let links = []
  for (let img_path of img_paths) {
    uploadToImgur(img_path, description, clientId)
      .then(link => links.push(link))
      .catch(err => {
        throw err
      })
  }

  if (links.length == 1) {
    core.setOutput("imgur_url", links[0])
  } else {
    core.setOutput("imgur_url", JSON.stringify(links))
  }
}

function uploadToImgur(img_path, description, clientId) {
  const axiosConfig = {
    method: "post",
    url: "https://api.imgur.com/3/image",
    headers: {
      "Authorization": `Client-ID ${clientId}`
    },
    data: {
      image: fs.readFileSync(img_path, "base64"),
      type: "base64",
      description
    }
  }

  return axios(axiosConfig)
    .then(res => res.data)
    .then(res => {
      if (!res.success) {
        throw new Error(`Request failed. Status code: ${res.status}. Error: ${res.data.error}`)
      }
      console.log("Request successful. Image URL is at: " + res.data.link)
      return res.data.link
    })
    .catch(err => {throw err})
}