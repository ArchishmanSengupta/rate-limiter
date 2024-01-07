const express = require('express');
const moment = require('moment');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

/// Fixed Window Implementation
const fwRateLimiter = require('./middleware/fw-rate-limiter');

// token bucket implementation

const tbucketRateLimiter = require('./middleware/tb-rate-limiter');

// LeakyBucket implementation

// const LeakyBucketRateLimiter = require('./leaky-bucket-rate-limiter');


const app = express();
const port = 3000|| 7000;
const endPoint = '/ping';
const currentTime = moment().unix();

let hitCounter = 1;

/* -------- Middleware ----------*/

// 1. tokenBucket implementation
app.use(tbucketRateLimiter.tokenBucketMiddleware);

//2. fixedWindow implementation
// app.use(fwRateLimiter.fixedWindowRateLimiter);

/* -------- Middleware ----------*/

app.get(endPoint, async(req, res) => {
    console.log(`request hit count: ${hitCounter}`);
    res.status(200).json({
        "success": true,
        "timestamp": currentTime,
        "message":`${hitCounter}`
    });
    hitCounter += 1;
});

const makeRequests = async () => {
    for (let i = 0; i < 200; i++) {
        try {
            const response = await axios.get(`http://localhost:${port}${endPoint}`);
            console.log(`Response ${i + 1}:`, response.data);
        } catch (error) {
            console.error(`Error making request ${i + 1}:`, error.message);
        }
        
        await new Promise(resolve => setTimeout(resolve, 10));
    }
};

app.listen(port, function() {
    console.log(`listening on ${port}:`);
    makeRequests();
});