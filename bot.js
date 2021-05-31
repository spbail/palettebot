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


function postTweet() {

    T.post('statuses/update', { status: 'hello world! beep beep :)' }, function(err, data, response) {
        console.log(data)
    })

}

function postTweetWithImage(statusText, imgPath) {
    //
    // post a tweet with media - example from the Twit docs
    //
    var b64content = fs.readFileSync(imgPath, { encoding: 'base64' })

    // first we must post the media to Twitter
    T.post('media/upload', { media_data: b64content }, function(err, data, response) {
        // now we can assign alt text to the media, for use by screen readers and
        // other text-based presentations and interpreters
        var mediaIdStr = data.media_id_string
        var altText = "A color palette"
        var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

        T.post('media/metadata/create', meta_params, function(err, data, response) {
            if (!err) {
                // now we can reference the media and post a tweet (media will attach to the tweet)
                var params = { status: statusText, media_ids: [mediaIdStr] }

                T.post('statuses/update', params, function(err, data, response) {
                    console.log(data)
                })
            }
        })
    })
}


// Post, then exit - this is run every interval by the Heroku scheduler
postTweetWithImage('Beep beep, here\'s a pretty color palette for you!', './palette1.jpg');
process.exitCode = 0;