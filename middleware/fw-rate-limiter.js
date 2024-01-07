/*
----------------------------------------------------------------
FIXED WINDOW ALGORITHM RATE LIMITER MIDDLEWARE
----------------------------------------------------------------
*/

const { count } = require('console');
const Redis = require('ioredis');
const moment = require('moment');

const dotenv = require('dotenv');
dotenv.config();

const redisUrl = process.env.REDIS_CLIENT_URL;

const redisClient = new Redis({url: redisUrl});
redisClient.on('error', (err)=> console.log('redis client error:' + err));

/**
 * During a specific time interval,let's say 60 seconds, total
 * number of requests can a single user can post is 10
 *
 * RedisClient -> user, count, timestamp
 * timeDifferene -> currentTime - lastTimeStamp[redisCache's ts]
 *
 * 1. If the difference is greater than the rateLimitDuration
 * then add it to the rate Limit hashtable
 *
 * 2. if the count is  < number of requests allowed
 * COUNT++ else rate-limit the user
 */
const RATELIMIT_DURATION_IN_SECONDS = 109;
const NUMBER_OF_REQUESTS_ALLOWED = 200;

module.exports = {
    fixedWindowRateLimiter: async(req, res, next)=>{
        console.log(req.headers);
        const userId = req.headers["user_id"]
        const currentTime = moment().unix();

        const result = await redisClient.hgetall(userId)

        if(Object.keys(result).length === 0){
            await redisClient.hset(userId,{
                "created_at": currentTime,
                "count": 1
            });
        return next();
        }
            /// Time Difference
            const diff = (currentTime - result["created_at"]);

            if(diff > RATELIMIT_DURATION_IN_SECONDS){
                await redisClient.hset(userId,{
                    "created_at": currentTime,
                    "count": 1
                });
                return next();
            }

            if(result["count"] > NUMBER_OF_REQUESTS_ALLOWED){
                return res.status(429).json(
                    {
                        "success": false,
                        "timestamp": currentTime,
                        "message": 'user-ratelimited'
                    }
                );
            }else{
                await redisClient.hset(userId,{
                    "count": parseInt(result["count"]) + 1
                });
                return next();
            }
        
    }
}