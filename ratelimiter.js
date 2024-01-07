const express = require('express');
const moment = require('moment');

/// Fixed Window Implementation
// const fwRateLimiter = require('./fw-rate-limiter');

// token bucket implementation

const tbucketRateLimiter = require('./tb-rate-limiter');

// LeakyBucket implementation

// const LeakyBucketRateLimiter = require('./leaky-bucket-rate-limiter');


const app = express();
const port = 3000;
const endPoint = '/ping';
const currentTime = moment().unix();

let hitCounter = 1;
// app.use(tbucketRateLimiter.tokenBucketMiddleware);
app.use(fwRateLimiter.fixedWindowRateLimiter);

app.get(endPoint, async(req, res) => {
    console.log(`request hit count: ${hitCounter}`);
    res.status(200).json({
        "success": true,
        "timestamp": currentTime,
        "message":`${hitCounter}`
    });
    hitCounter += 1;
});
app.listen(port, function() {
    console.log(`listening on ${port}:`)
});