require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const path = require('path')

const app = express()
const port = 3000
const today = new Date().toLocaleDateString('en-CA');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// your API calls

// example API call
app.get('/apod', async (req, res) => {
    try {
        let image = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`)
            .then(res => res.json())
        res.send({ image })
    } catch (err) {
        console.log('error:', err);
    }
});

app.get('/rover/:name', async (req, res) => {
    try {
        const roverName = req.params.name;
        console.log("Fetching rover:", roverName);

        let roverData  = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${roverName}/photos?earth_date=${today}=1000&api_key=${process.env.API_KEY}`)
            .then(res => res.json())
        res.send({ rover: roverData  })
    } catch (err) {
        console.log('error:', err);
    }
});

app.use('/', express.static(path.join(__dirname, '../public')))
app.listen(port, () => console.log(`Example app listening on port ${port}!`))