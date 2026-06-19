const axios = require('axios');

const LOG_API_URL = 'http://4.224.186.213/evaluation-service/logs';

const validStacks = ['backend', 'frontend'];
const validLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
const validPackages = [
    'cache', 'controller', 'cron_job', 'db', 'domain',
    'handler', 'repository', 'route', 'service',
    'api', 'component', 'hook', 'page', 'state'
];

async function Log(stack, level, pkg, message) {
    if (!validStacks.includes(stack) || !validLevels.includes(level) || !validPackages.includes(pkg)) {
        console.error('[logger] invalid params:', stack, level, pkg);
        return;
    }

    try {
        await axios.post(LOG_API_URL, {
            stack,
            level,
            package: pkg,
            message
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('[logger] failed to send log:', err.message);
    }
}

module.exports = { Log };