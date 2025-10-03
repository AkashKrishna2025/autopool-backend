const express = require("express");
const cron = require('node-cron');
const moment = require('moment-timezone');

const { io, getOnlineDrivers} = require("../socket/socket");
const db = require("../models");

const UsersModel = db.users;

process.env.TZ = 'Asia/Kolkata';

async function markDriversOffline() {
    try {
        //console.log("cron run", Date.now())
        const maxOfflineMin = 10;
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        console.log("cron run", twoMinutesAgo, maxOfflineMin)
        const result = await UsersModel.updateMany(
            { lastOnline: { $lt: twoMinutesAgo }, isOnline: true },
            { $set: { isOnline: false} }
        );
        //console.log("cron res -> ", result);
        if (result && result.modifiedCount > 0) {
            console.log("cron driver lists")
            await getOnlineDrivers();
        }
    } catch (error) {
        console.error('Error marking users offline:', error);
    }
}

function startCronJobs() {
    cron.schedule('* * * * *', async () => {
        try {
            if(process.env.ENVIROMENT === "production") {
                await markDriversOffline();
            }
        } catch (error) {
            console.error('Error executing mark user offline cron job:', error);
        }
    });
}
module.exports = { startCronJobs };