import { Telegraf, session } from "telegraf";
import moment from "moment";
import dotenv from "dotenv";
import axios from "axios";

// Load environment variables from .env file
dotenv.config();

// Create a new Telegraf instance
const bot = new Telegraf(process.env.TOKEN);

// Middleware to manage sessions
bot.use(session());

// Start command to initiate login process
bot.command('start', (ctx) => {
    ctx.session = { step: 'login', credentials: [] }; // Initialize session
    ctx.reply('Please enter your login:');
});

// Handle user messages
bot.on('text', (ctx) => {
    if (!ctx.session || !ctx.session.step) {
        ctx.reply('Please type /start to begin the login process.');
        return;
    }

    const userMessage = ctx.message.text;

    if (ctx.session.step === 'login') {
        // Store login
        ctx.session.credentials[0] = userMessage;
        ctx.session.step = 'password'; // Move to next step
        ctx.reply('Login saved. Now, enter your password:');
    } else if (ctx.session.step === 'password') {
        // Store password
        ctx.session.credentials[1] = userMessage;
        ctx.reply(
            "Biroz kuting...",
        );

        axios.post("https://talaba.tsue.uz/rest/v1/auth/login", {
            login: ctx.session.credentials[0],
            password: ctx.session.credentials[1]
        }).then((response) => {
            console.log(response.data);
            axios.get("https://talaba.tsue.uz/rest/v1/account/me", {
                headers: {
                    Authorization: `Bearer ${response.data.data.token}`
                }
            }).then((response) => {
                console.log(response.data);
                ctx.replyWithPhoto(response.data.data.image, {
                    parse_mode: "HTML",
                    caption: `<b>F.I.O:</b> <i>${response.data.data.full_name}</i>\n<b>Fakultet:</b> <i>${response.data.data.faculty.name}</i>\n<b>Guruh:</b> <i>${response.data.data.group.name}</i>\n<b>Telefon:</b> <i>${response.data.data.phone}</i>\n<b>Email:</b> <i>${response.data.data.email}</i>\n<b>Passport:\</b> <i>${response.data.data.passport_number}</i>\n<b>Doimiy yashash joyi:</b> <i>${response.data.data.address}</i>\n<b>Tug'ilgan sana:</b> <i>${moment.unix(response.data.data.birth_date).format('DD-MM-YYYY')}</i>`
                });
            }).catch((error) => {
                console.error(error);
            })
        }).catch((error) => {
            ctx.reply(error.response.data.error);
            console.error(error.response.data.error);
        })



        ctx.session = null; // Clear session
    }
});

// Start the bot
bot.launch().then(() => {
    console.log('Bot is running...');
});