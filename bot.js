require('dotenv').config()
const twit = require('twit')
const fs = require('fs')

var config = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
}

// Create a new Twit instance
const T = new twit(config)


function getPaletteImage() {
    const fs = require('fs')
    const { createCanvas } = require('canvas')

    const canvWidth = 400
    const canvHeight = 230

    const canvas = createCanvas(canvWidth, canvHeight)
    const ctx = canvas.getContext('2d')

    var width = 72;
    var height = 190;
    var offset = 20;

    var [colors, description] = getRandomPalette();

    colors.forEach(function(col, i) {
        ctx.fillStyle = col;
        ctx.fillRect((width * i) + offset, offset, width, height);
    })

    const ts = new Date().toISOString().replace(/:/g, '');
    var fileName = './img/img_' + ts + '.png';
    console.log('Generated image ' + fileName);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(fileName, buffer);
    return [fileName, description]

}

function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array
}

function getRandomPalette() {
    // Using https://github.com/c0bra/color-scheme-js
    var colorScheme = require('color-scheme');
    var scheme = new colorScheme;

    // Generating a random hue and random variation for the color scheme
    var randomHue = randomInteger(0, 359);
    console.log('Random hue: ' + randomHue);

    var variations = Object.keys(colorScheme.PRESETS)
    var randomVariation = shuffleArray(variations)[0]
    console.log('Random variation: ' + randomVariation)

    scheme.from_hue(randomHue) // Start the scheme 
        .scheme('triade') // Use the 'triade' scheme, that is, colors
        // selected from 3 points equidistant around
        // the color wheel.
        .variation(randomVariation); // Use the 'soft' color variation

    var allColors = scheme.colors();
    // Adding the # prefix
    allColors.forEach(function(col, index, arr) {
        arr[index] = '#' + col;
    });
    console.log('All colors:')
    console.log(allColors)

    // Randomly selecting 5 colors to draw on the canvas
    var selectedColors = shuffleArray(allColors).splice(0, 5)

    console.log('Selected colors:')
    console.log(selectedColors)

    var description = '\n\ncolor-scheme.js parameters used: \n- hue: ' +
        randomHue + '\n- variation: ' + randomVariation + '\n' +
        '- colors: ' + selectedColors.join(', ')
    return [selectedColors, description]
}

function postTweetWithImage(statusText, imgPath) {
    //
    // Post a tweet with media - example from the Twit docs
    //

    var b64content = fs.readFileSync(imgPath, { encoding: 'base64' })

    // First we must post the media to Twitter
    T.post('media/upload', { media_data: b64content }, function(err, data, response) {
        // Now we can assign alt text to the media, for use by screen readers and
        // other text-based presentations and interpreters
        var mediaIdStr = data.media_id_string
        var altText = "A color palette"
        var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

        T.post('media/metadata/create', meta_params, function(err, data, response) {
            if (!err) {
                // Now we can reference the media and post a tweet (media will attach to the tweet)
                var params = { status: statusText, media_ids: [mediaIdStr] }

                T.post('statuses/update', params, function(err, data, response) {
                    console.log(data)
                })
            }
        })
    })
}

function getGreeting() {
    var date = new Date()
    var curHour = date.getHours()

    if (curHour < 12) {
        return 'Have a lovely day!'
    } else {
        return 'Have a lovely evening!'
    }
}

// Post, then exit - this is run every interval by the Heroku scheduler
[imgPath, description] = getPaletteImage();
postTweetWithImage('Beep beep, here\'s a pretty color palette for you! ' +
    description + '\n\n' + getGreeting() +
    '\n\n#twitterbot #colorpalette #colors #palette #prettycolors', imgPath
);
process.exitCode = 0;