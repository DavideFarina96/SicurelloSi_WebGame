var canvas;
var context;

// Game parameters
var size_mult = 1;
var framerate = 60;
var movement_speed = 0.6;
var horizontal_speed = 0.15;
var spawn_time = 2000;
var lose_position = 75;

var loaded_assets = 0;
var total_assets = 41;
var game_state = "menu";
var current_level = 0;

//starting and ending sprite IDs for prizes and obstacles, based on current level
var levels = [  {speed: 0.6, next_level_score: 250, spawn_time: 2000, start_prize: 0, end_prize: 4, start_obstacle: 0, end_obstacle: 5},
                {speed: 0.8, next_level_score: 600, spawn_time: 1600, start_prize: 5, end_prize: 9, start_obstacle: 6, end_obstacle: 11},
                {speed: 1.0, next_level_score: 100000, spawn_time: 1300, start_prize: 10, end_prize: 13, start_obstacle: 12, end_obstacle: 17}
            ];

// Game objects
var player = {
    score: 0,
    lifes: 0,
    lane: 1,
    sprites: [],
    record: 0
};

var map_coords = { //coords are in % of width and height, from top left 
    char_in_lanes: [{ x: 10, y: 80 },
    { x: 37, y: 80 },
    { x: 67, y: 80 }],
    spawn_in_lanes: [{ x: 35, y: 34 },
    { x: 50, y: 34 },
    { x: 65, y: 34 },
    { x: 20, y: 8 }, //cloud1
    { x: 50, y: 13 }] //cloud2
};

var map_sprite;
var menu_sprite
var gameover_sprite;
var obstacle_sprites = [];
var prize_sprites = [];
var clouds = [];
var cloud_sprite;
var level_message_sprite;
var logo_sprite;

var objects = [];

var ok_area = {
    x: 0.15,
    y: 0.8,
    width: 0.7,
    height: 0.15
}

// Sounds
var success_sound;
var error_sound;

// Clocks and timers
var frame_clock;
var spawn_clock;
var check_loaded_timer;
var use_arrows_message_timer;
var use_arrows_message_is_present = false;
var new_level_message_timer;
var new_level_message_is_present = false;

// ---------------------------
/*
    TODO:
*/

// Event Listeners
document.addEventListener('keydown', function (event) {
    const key = event.key; // "a", "1", "Shift", etc.
    //console.log(key);

    if (key == "ArrowRight" && player.lane < 2)
        player.lane++;
    else if (key == "ArrowLeft" && player.lane > 0)
        player.lane--;
    else if (key == "r")
        restart_game();
});

function isIntersect(point, rectangle) {
    return (point.x >= rectangle.x && point.x <= rectangle.x + rectangle.width && point.y >= rectangle.y && point.y <= rectangle.y + rectangle.height);
}

// Main
function main() {
    
    init_canvas();
    load_sprites();
    var record = document.cookie
    //console.log("new rec: " + record)
    if(record > player.record)
        player.record = record;

    // Click Listener
    canvas.addEventListener('click', (e) => {
        var rect = canvas.getBoundingClientRect();
        const mouse_pos = {
            x: (e.clientX - rect.x) / canvas.width,
            y: (e.clientY - rect.y) / canvas.height
        };
        if (isIntersect(mouse_pos, ok_area)) {
            restart_game();
        }
    
    });

    // Wait for assets to load
    check_loaded = setInterval(function () {
        //console.log(loaded_assets + " " + total_assets)
        if (loaded_assets == total_assets) {
            frame_clock = setInterval(draw_frame, 1000 / framerate, false);
            spawn_object("cloud", cloud_sprite, 3);
            spawn_object("cloud", cloud_sprite, 4);
            draw_main_menu();
            clearInterval(check_loaded);
        }
    }, 100);
}

function start_new_game() {
    setup_game();
    draw_frame(true);

    success_sound.start();
}

function init_canvas() {
    canvas = document.getElementById("gameCanvas");
    context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    resize_canvas();
}

function setup_game() {
    current_level = 0;
    movement_speed = levels[current_level].speed;
    player.lifes = 3;
    player.selected_char = 1;
    player.lane = 1;
    player.score = 0;

    spawn_clock = setInterval(spawn_next_wave, levels[current_level].spawn_time);
    use_arrows_message_is_present = true;
    use_arrows_message_timer = setTimeout(function(){ use_arrows_message_is_present = false; clearTimeout(use_arrows_message_timer)}, 2000);
    game_state = "playing";
}

function load_sprites() {
    success_sound = new Sound("sounds/success.mp3", 100, true);
    error_sound = new Sound("sounds/error.mp3", 100, true);

    // PLAYER
    player.sprites[0] = new Image();
    player.sprites[0].src = "images/Sicurello.png";
    player.sprites[0].onload = function () {
        loaded_assets++;
    }

    player.sprites[1] = new Image();
    player.sprites[1].src = "images/SicurelloVestito.png";
    player.sprites[1].onload = function () {
        loaded_assets++;
    }

    player.sprites[2] = new Image();
    player.sprites[2].src = "images/Ambulanza.png";
    player.sprites[2].onload = function () {
        loaded_assets++;
    }

    // MAP
    map_sprite = new Image();
    map_sprite.src = "images/Background.png";
    map_sprite.onload = function () {
        loaded_assets++;
    }

    menu_sprite = new Image();
    menu_sprite.src = "images/Menu.png";
    menu_sprite.onload = function () {
        loaded_assets++;
    }

    gameover_sprite = new Image();
    gameover_sprite.src = "images/Game-over.png";
    gameover_sprite.onload = function () {
        loaded_assets++;
    }

    // OBSTACLES
    for (var i = 0; i < 18; i++) {
        obstacle_sprites.push(new Image());
        var path = "images/Errori-"
        if(i < 9)
            path += "0";
        path += ((i + 1) + ".png");
        obstacle_sprites[i].src = path;
        obstacle_sprites[i].onload = function () {
            loaded_assets++;
        }
    }

    // PRIZES
    for (var i = 0; i < 14; i++) {
        prize_sprites.push(new Image());
        var path = "images/DPI-"
        if(i < 9)
            path += "0";
        path += ((i + 1) + ".png");
        prize_sprites[i].src = path;
        prize_sprites[i].onload = function () {
            loaded_assets++;
        }
    }

    // CLOUDS
    cloud_sprite = new Image();
    cloud_sprite.src = "images/cloud.png";
    cloud_sprite.onload = function () {
        loaded_assets++;
    }

    // OTHER
    level_message_sprite = new Image();
    level_message_sprite.src = "images/level_message.png";
    level_message_sprite.onload = function () {
        loaded_assets++;
    }

    logo_sprite = new Image();
    logo_sprite.src = "images/Scritta.png";
    logo_sprite.onload = function () {
        loaded_assets++;
    }
}

// Helper resize + draw
function resize_canvas() {
    if (height != window.innerHeight || width != height / 1.5) {
        var height = window.innerHeight;
        var width = height / 1.5;
        size_mult = height / 900;

        canvas.style.width = height.toString() + "px";
        canvas.style.width = width.toString() + "px";
        canvas.height = height;
        canvas.width = width
    }
}

function draw_main_menu() {
    context.drawImage(map_sprite, 0, 0, canvas.width, canvas.height);
    context.drawImage(menu_sprite, canvas.width * 0.15, canvas.height * 0.35, canvas.width * 0.7, canvas.height * 0.6);
    context.drawImage(logo_sprite, canvas.width * 0.2, canvas.height * 0.4, canvas.width * 0.6, canvas.height * 0.07);
    var fontSize = 37 * size_mult;
    context.font = fontSize + "pt SicurelloFont";
    context.fillStyle = "#000000";
    context.textAlign = "center";
    context.fillText("aiuta", (canvas.width / 100) * 50, (canvas.height / 100) * 57);
    context.fillText("Sicurello!", (canvas.width / 100) * 50, (canvas.height / 100) * 64);
    fontSize = 32 * size_mult;
    context.font = fontSize + "pt SicurelloFont";
    context.fillText("Record: " + player.record, (canvas.width / 100) * 50, (canvas.height / 100) * 74);
    fontSize = 50 * size_mult;
    context.font = fontSize + "pt SicurelloFont";
    context.fillText("Istruzioni", (canvas.width / 100) * 50, (canvas.height / 100) * 91);
}

function draw_instructions() {
    context.drawImage(map_sprite, 0, 0, canvas.width, canvas.height);
    context.drawImage(gameover_sprite, canvas.width * 0.15, canvas.height * 0.25, canvas.width * 0.7, canvas.height * 0.7);
    var fontSize = 25 * size_mult;
    context.font = fontSize + "pt SicurelloFont";
    context.fillStyle = "#000000";
    context.textAlign = "center";
    context.fillText("Aiuta sicurello a:", (canvas.width / 100) * 50, (canvas.height / 100) * 31);
    context.fillText("Raccogliere", (canvas.width / 100) * 50, (canvas.height / 100) * 43);
    context.fillText("i dpi", (canvas.width / 100) * 50, (canvas.height / 100) * 48);
    context.fillText("Evitare i virus", (canvas.width / 100) * 50, (canvas.height / 100) * 60);
    context.fillText("Gestire", (canvas.width / 100) * 50, (canvas.height / 100) * 72);
    context.fillText("l'emergenza", (canvas.width / 100) * 50, (canvas.height / 100) * 77);
    var fontSize = 30 * size_mult;
    context.font = fontSize + "pt SicurelloFont";
    context.fillText("Livello 1", (canvas.width / 100) * 50, (canvas.height / 100) * 38);
    context.fillText("Livello 2", (canvas.width / 100) * 50, (canvas.height / 100) * 55);
    context.fillText("Livello 3", (canvas.width / 100) * 50, (canvas.height / 100) * 67);
    fontSize = 60 * size_mult;
    context.font = fontSize + "pt SicurelloFont";
    context.fillText("Inizia", (canvas.width / 100) * 50, (canvas.height / 100) * 91.5);
}

function draw_use_arrows_message()
{
    context.drawImage(level_message_sprite, canvas.width * 0.15, canvas.height * 0.28, canvas.width * 0.7, canvas.height * 0.16);
    context.textAlign = "center";
    context.fillStyle = "#000000";
    fontSize = 30 * size_mult;
    context.font = fontSize + "pt SicurelloFont";
    context.fillText("Usa le frecce", (canvas.width / 100) * 50, (canvas.height / 100) * 35); 
    context.fillText("Per spostarti", (canvas.width / 100) * 50, (canvas.height / 100) * 40); 
}

function draw_game_over() {
    context.drawImage(map_sprite, 0, 0, canvas.width, canvas.height);
    context.drawImage(gameover_sprite, canvas.width * 0.15, canvas.height * 0.25, canvas.width * 0.7, canvas.height * 0.7);
    var fontSize = 37 * size_mult;
    context.font = fontSize + "pt SicurelloFont";
    context.fillStyle = "#000000";
    context.textAlign = "center";
    context.fillText("Game Over!", (canvas.width / 100) * 50, (canvas.height / 100) * 38);
    context.fillText("Punteggio:", (canvas.width / 100) * 50, (canvas.height / 100) * 50);
    fontSize = 50 * size_mult;
    context.font = fontSize + "pt SicurelloFont";
    context.fillText(player.score, (canvas.width / 100) * 50, (canvas.height / 100) * 58);
    fontSize = 32 * size_mult;
    context.font = fontSize + "pt SicurelloFont";
    context.fillText("Record: " + player.record, (canvas.width / 100) * 50, (canvas.height / 100) * 75);
    fontSize = 60 * size_mult;
    context.font = fontSize + "pt SicurelloFont";
    context.fillText("Riprova", (canvas.width / 100) * 50, (canvas.height / 100) * 91.5);
}

function draw_background() {
    context.drawImage(map_sprite, 0, 0, canvas.width, canvas.height);
}

function draw_new_level_message() {
    context.drawImage(level_message_sprite, canvas.width * 0.15, canvas.height * 0.28, canvas.width * 0.7, canvas.height * 0.1);
    context.textAlign = "center";
    context.fillStyle = "#000000";
    fontSize = 35 * size_mult;
    context.font = fontSize + "pt SicurelloFont";
    context.fillText("Nuovo livello", (canvas.width / 100) * 50, (canvas.height / 100) * 35);
}

function draw_character(lane) {
    var x = (canvas.width / 100) * map_coords.char_in_lanes[lane].x;
    var y = (canvas.height / 100) * map_coords.char_in_lanes[lane].y;
    context.drawImage(player.sprites[current_level], x, y, 150 * size_mult, 150 * size_mult);
}

function draw_all_objects() {
    for (var i = 0; i < objects.length; i++) {
        draw_object(objects[i]);
    }
}

function draw_object(object) {
    var sprite_mult = object.y / 100;
    var sprite_size = 150 * size_mult * sprite_mult;

    var x = (canvas.width / 100) * object.x - sprite_size / 2;
    var y = (canvas.height / 100) * object.y;

    context.drawImage(object.sprite, x, y, sprite_size, sprite_size);
}

function draw_frame(refresh_size) {

    if (game_state == "playing") {
        move_down_objects();

        if (refresh_size)
            resize_canvas();
        draw_background();
        draw_character(player.lane);
        draw_all_objects();
        update_text();
    }
    else if (game_state == "menu") {
        draw_main_menu();
    }
    else if (game_state == "instructions") {
        draw_instructions();
    }
    else if (game_state == "gameover") {
        draw_game_over();
    }
    if(new_level_message_is_present)
        draw_new_level_message()
    if(use_arrows_message_is_present)
        draw_use_arrows_message()
    draw_clouds();
}

function draw_clouds() {

    for (var i = 0; i < clouds.length; i++) {
        clouds[i].x += 0.1;

        var sprite_mult = clouds[i].y / 100;
        var sprite_size = 150 * size_mult * sprite_mult;

        var x = (canvas.width / 100) * clouds[i].x - sprite_size / 2;
        var y = (canvas.height / 100) * clouds[i].y;

        context.drawImage(clouds[i].sprite, x, y, 100 * size_mult, 60 * size_mult);
        if (clouds[i].x > 100) {
            spawn_object("cloud", clouds[i].sprite, clouds[i].lane);
            clouds.splice(i, 1);
            i--;
        }
    }
}

// Spawn
function spawn_object(type, sprite, lane) {
    var new_obs = {
        type: type,
        sprite: sprite,
        lane: lane,
        x: map_coords.spawn_in_lanes[lane].x,
        y: map_coords.spawn_in_lanes[lane].y
    }
    if (type == "cloud") {
        if (clouds.length >= 2) //Terrible way to avoid the first 2 clouds being repositioned
            new_obs.x = -13;
        clouds.push(new_obs);
    }
    else
        objects.push(new_obs);
}

function move_down_objects() {
    // speed up for next levels

    if(player.score >= 1000) //keep increasing speed
    {
        movement_speed = levels[2].speed + (player.score - 1000)/1000;
    }
    else if(player.score >= levels[current_level].next_level_score && current_level == 1) //Go to level 2: do just once
    {
        current_level = 2;
        clearInterval(spawn_clock);
        spawn_clock = setInterval(spawn_next_wave, levels[current_level].spawn_time);
        movement_speed = levels[current_level].speed;
        new_level_message_is_present = true;
        new_level_message_timer = setTimeout(function() { new_level_message_is_present = false; clearTimeout(new_level_message_timer) }, 1000);
    }
    else if(player.score >= levels[current_level].next_level_score && current_level == 0) //Go to level 1: do just once
    {
        current_level = 1;
        clearInterval(spawn_clock);
        spawn_clock = setInterval(spawn_next_wave, levels[current_level].spawn_time);
        movement_speed = levels[current_level].speed;
        new_level_message_is_present = true;
        new_level_message_timer = setTimeout(function() { new_level_message_is_present = false; clearTimeout(new_level_message_timer) }, 1000);
    }
    // move objects
    for (var i = 0; i < objects.length; i++) {
        objects[i].y += movement_speed * (objects[i].y / 100);

        if (objects[i].lane == 0)
            objects[i].x -= movement_speed * horizontal_speed;
        if (objects[i].lane == 2)
            objects[i].x += movement_speed * horizontal_speed;

        //Check collision with player
        if (objects[i].y > lose_position && objects[i].lane == player.lane) {
            if (objects[i].type == "obstacle") {
                error_sound.start();
                //console.log("lost " + i)
                player.lifes--;
                if (player.lifes == 0) {
                    game_over();
                }
            }
            else if (objects[i].type == "prize") {
                success_sound.start();
                player.score += 50;
            }
            objects.splice(i, 1);
            i--;
        }
        else if (objects[i].y > 86) //out of screen
        {
            objects.splice(i, 1);
            i--;
        }
    }
}

function update_text() {
    var fontSize = 37 * size_mult;
    context.font = fontSize + "pt SicurelloFont";
    context.fillStyle = "#ffffff";
    context.textAlign = "left";
    context.fillText("Punti: " + player.score, (canvas.width / 100) * 3, (canvas.height / 100) * 7);
    context.fillText("Vite: " + player.lifes, (canvas.width / 100) * 68, (canvas.height / 100) * 7);
}

function spawn_next_wave() {
    var added_obstacles = 0;
    for (var i = 0; i < 3; i++) //3 = n of lanes
    {
        var type = parseInt(Math.random() * 3); //0 = nothing, 1 = obstacle, 2 = prize
        if (type == 1) {
            if (added_obstacles < 2) {
                var sprite_id = parseInt(Math.random() * (levels[current_level].end_obstacle - levels[current_level].start_obstacle) + levels[current_level].start_obstacle);
                spawn_object("obstacle", obstacle_sprites[sprite_id], i);
                added_obstacles++;
            }
            else //if we already have 2 obstacles, we can not have a third. Try a new spawn
            {
                i--;
            }
        }
        else if (type == 2) {
            var sprite_id = parseInt(Math.random() * (levels[current_level].end_prize - levels[current_level].start_prize) + levels[current_level].start_prize);
            spawn_object("prize", prize_sprites[sprite_id], i);
        }

    }
}

function game_over() {
    //console.log(player.score)
    //console.log(player.record)
    if(player.score > player.record)
    {
        player.record = player.score;
        document.cookie = player.score + "; expires=Tue, 31 Dec 2030 12:00:00 UTC";
        //console.log("new rec: " + document.cookie)
    }

    game_state = "gameover";
    clearInterval(spawn_clock);
}

function restart_game() {
    if (game_state == "menu") {
        game_state = "instructions";
    }
    else {
        clearInterval(spawn_clock);
        objects = [];
        start_new_game();
    }
}

// source: https://stackoverflow.com/a/11331200/4298200
function Sound(source, volume, loop) {
    this.source = source;
    this.volume = volume;
    this.loop = loop;
    var son;
    this.son = son;
    this.finish = false;
    this.stop = function () {
        document.body.removeChild(this.son);
    }
    this.start = function () {
        if (this.finish) return false;
        this.son = document.createElement("embed");
        //this.son.setAttribute("type", "audio/mp3");
        this.son.setAttribute("src", this.source);
        this.son.setAttribute("hidden", "true");
        this.son.setAttribute("volume", this.volume);
        this.son.setAttribute("autostart", "true");
        this.son.setAttribute("loop", this.loop);
        document.body.appendChild(this.son);
    }
    this.remove = function () {
        document.body.removeChild(this.son);
        this.finish = true;
    }
    this.init = function (volume, loop) {
        this.finish = false;
        this.volume = volume;
        this.loop = loop;
    }
}