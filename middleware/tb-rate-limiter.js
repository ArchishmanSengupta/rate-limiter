/*
----------------------------------------------------------------
TOKEN BUCKET ALGORITHM RATE LIMITER MIDDLEWARE
----------------------------------------------------------------
*/

const Redis = require('ioredis');
const dotenv = require('dotenv');
const moment = require('moment');
dotenv.config();

// Create a Redis client
const redisClient = new Redis({ url: process.env.REDIS_CLIENT_URL });
redisClient.on('error', (err) => console.log('redis client error:' + err));

// Token bucket middleware
const tokenBucketMiddleware = async (req, res, next) => {
    // Unique key for the token bucket in Redis
    const bucketKey = 'token_bucket';

    // Maximum tokens the bucket can hold (capacity)
    const capacity = 10;

    // Time interval in seconds after which tokens are refilled
    const interval = 1;

    // Get the current time in Unix timestamp format
    const currentTime = moment().unix();

    // Check if the token bucket exists in Redis
    const exists = await redisClient.exists(bucketKey);

    if (!exists) {
        // If the bucket doesn't exist, initialize it with the specified capacity and current time
        await redisClient.hmset(bucketKey, {
            capacity: capacity,
            tokens: capacity,
            lastRefillTime: currentTime,
        });
    }

    // Retrieve information about the token bucket from Redis
    const bucketInfo = await redisClient.hgetall(bucketKey);

    // Calculate the elapsed time since the last refill
    const elapsedTime = currentTime - parseInt(bucketInfo.lastRefillTime);

    // Calculate the number of tokens to add based on the elapsed time and interval
    const tokensToAdd = Math.floor(elapsedTime / interval);

    // Adjust the token count, ensuring it doesn't exceed the capacity
    const newTokens = Math.min(capacity, parseInt(bucketInfo.tokens) + tokensToAdd);

    // Update the token bucket in Redis with the new token count and current time
    await redisClient.hmset(bucketKey, {
        tokens: newTokens,
        lastRefillTime: currentTime,
    });

    if (parseInt(bucketInfo.tokens) > 0) {
        // If there are available tokens, decrement the count and allow the request to proceed
        await redisClient.hset(bucketKey, 'tokens', parseInt(bucketInfo.tokens) - 1);
        next();
    } else {
        // If the token count is zero, respond with a rate-limit exceeded message
        res.status(429).json({
            success: false,
            message: 'Rate limit exceeded. Try again later.',
        });
    }
};

module.exports = {
    tokenBucketMiddleware,
};
