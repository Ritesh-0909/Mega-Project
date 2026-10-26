const { createClient} = require ('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'mocha-neogentle-macroquiet-35586.db.redis.io',
        port: 13228
    }
});

module.exports = redisClient;