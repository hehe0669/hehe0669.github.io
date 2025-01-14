// canvas and context declaration

const canvas = document.getElementById('canvas');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const drawing = canvas.getContext('2d');


//classes

//class for any text
class GameText //any object created by this class have "GameText_" at the start
{
    //static property and static method

    static instanceList = []; //static list that store all the created instance 
    

    /*
    GameText parameter explaination:

    - Shortcut:
    + Shortcut1 => "Number, option: 0 for no change, increasing for moving right, decreasing for moving left"
    + Shortcut2 => "Number, option: 0 for no change, increasing for moving down, decreasing for moving up"

    1. text(type: String) => what text value is the text obj holding

    2. getXFomula(type: String, format option: start from the left edge = `${Shortcut1}`, start from middle
    of the screen = `window.innerWidth / 2 + ${Shortcut1}`, start from right edge =
    `window.innerWidth + ${Shortcut1}`) => store the fomula to get the x coodinate on the screen when draw

    3. getYFomula(type: String, format option: start from the top edge = `${Shortcut2}`, start from middle
    of the screen = `window.innerHeight / 2 + ${Shortcut2}`, start from bottom edge =
    `window.innerHeight + ${Shortcut2}`) => store the fomula to get the y coodinate on the screen when draw

    4. fontSize(type: Number, range: x >= 1) => the font size of the text

    5. textAlign(type: String, option: ["left", "right", "center"]) => the alignment of the text

    6. boldToggle(type: Boolean) => is the text bold? true for yes

    7. italicToggle(type: Boolean) => is the text italic? true for yes

    8. color(type: String, format: `${Number from 0 to 255}, {Number from 0 to 255}, {Number from 0 to 255}`)
    => color of the text

    9. borderToggle(type: Boolean) => does the text have border or not, true for yes

    10. borderColor(type: String, format:
    `${Number from 0 to 255}, {Number from 0 to 255}, {Number from 0 to 255}`) => the border color

    11. borderThickness(type: Number, range: x >= 1) => the border thickness

    12. toggleCondition(type: Boolean) => value that determine wherever the text will be draw or not, true
    for yes
    */
    constructor(text, getXFomula, getYFomula, fontSize, textAlign, boldToggle, italicToggle, color, borderToggle, borderColor, borderThickness, toggleCondition)
    {
        this.font = "Ubuntu"; //defalut font for all GameText instance


        this.text = text;

        //the text x and y position is initialize base on the fomula provided

        this.x = eval(getXFomula);
        this.y = eval(getYFomula);

        this.getXFomula = getXFomula;
        this.getYFomula = getYFomula;

        this.fontSize = fontSize;
        this.textAlign = textAlign;
        this.boldToggle = boldToggle;
        this.italicToggle = italicToggle;

        this.color = `rgb(${color})`;

        this.borderToggle = borderToggle;
        this.borderColor = `rgb(${borderColor})`;
        this.borderThickness = borderThickness;

        this.toggleCondition = toggleCondition;


        //add the newly created instance to static array in this class
        GameText.instanceList.push(this);
    }

    draw()
    {
        if(this.toggleCondition)
        {
            //set up a string that will later pass to drawing.font
            /*
            posible combination(Note: 16px is just placeholder):
            - "16px Ubuntu"
            - "bold 16px Ubuntu"
            - "italic 16px Ubuntu"
            - "bold italic 16px Ubuntu"
            */
            const textCostumization = `${this.boldToggle ? "bold " : ""}${this.italicToggle ? "italic " : ""}${this.fontSize}px ${this.font}`;


            drawing.save();

            drawing.translate(this.x, this.y);

            drawing.font = textCostumization;
            drawing.textAlign = this.textAlign;

            if(this.borderToggle)
            {
                drawing.lineWidth = this.borderThickness
                drawing.strokeStyle = this.borderColor;

                drawing.strokeText(this.text, 0, 0);
            }

            drawing.fillStyle = this.color;

            drawing.fillText(this.text, 0, 0);

            drawing.restore();
        }
    }

    adjustPositionWhenResize()
    {
        this.x = eval(this.getXFomula);
        this.y = eval(this.getYFomula);
    }
}


//global obj that stored variable

//non-graphic object

//store everytime about the mouse
const mouse = 
{
    //mouse x and y

    x: 0,
    y: 0,

    angle: 0, //store the angle that the cursor had rotated, with the center of the screen being the origin
              //calcuated later in movemove event listener
    distance: 0, //store the distance between the cursor and the middle of the screen
                 //calcuated later in movemove event listener
    leftHoldDown: false, //is left key mouse holding down?
    rightHoldDown: false //is right key mouse holding down?
};

//object store everything related to FPS and drawing delay calculation
const fpsAndDrawDelay = 
{
    delayTracker: NaN, /* <===
                              used to track delay when drawing the result
                              set to NaN so the text showup as "Calculate..."
                              before calculating the right drawing delay,
                              then it is set to Date.now() later on to actually tracking the delay between drawing
                       */
    timeDelayedBetweenDraw: 1000, //delayed time between drawing the result


    delayedTime: Date.now(), //used to store the delay in milisec when drawing by getting the time before and after drawing and get the different

    accumulatedDelayedTime: 0, //used to store the total delayedTime before reaching timeDelayedBetweenDraw, used to find the average delay and FPS
    framePassed: 0, //used to store how much frame passed before reaching timeDelayedBetweenDraw, to help accumulatedDelayedTime calculate da average

    semicolonDownedCheck: false //check if ";" key is down or not
};

//object used to store the world position of player, method to convert from world position to screen position,
//method to check if a given obj is in the player FOV, method to give out change to postion change due to
//recoil, method that give out drawing position changes due to zooming
const position = 
{
    /*
    +: right
    -: left
    */
    x: 0, //player x

    /*
    +: up
    -: down
    */
    y: 0, //player y

    //since the browser have - as up and + as down,
    //the number stored in position.y will required switchSign() function to switch sign


    moveWhenOppositeDirection: true, //boolean check if the player should move when opposite direction key
                                     //is pressed. ex: pressing key for moving right and left
                                     //at same time. true for yes, moving direction are based on the
                                     //opposite key that pressed later. ex: if the player press right
                                     //then press left, the player will move left


    //properties related to horizontal position change

    right: false, //moved right
    left: false, //moved left

    oppositeX: false, //if the player is moving right and left at the same time

    rightIsNewDirection: false, //is the player moved right after and while holding left
    leftIsNewDirection: false, //is the player moved left after and while holding right

    //properties related to vertical position change
    up: false, //moved up
    down: false, //moved down

    oppositeY: false, //if the player is moving up and down at the same time

    upIsNewDirection: false, //is the player moved up after and while holding down
    downIsNewDirection: false, //is the player moved down after and while holding up


    speed: 5, //player movement speed

    //properties related to random position when spawn

    randomizedSpawn: true, //random position when spawn? true for yes
    floatRandomizeSpawnPosition: true, //should random starting position be a float or integer? true for float
    
    //x and y randomized position range

    highestRandomY: 100,
    lowestRandomY: -100,
    highestRandomX: 100,
    lowestRandomX: -100,


    //properties related to recoil stuff

    //x and y pos if the recoil came to effect immediately

    xPositionAfterRecoil: 0,
    yPositionAfterRecoil: 0,

    recoilDistanceThreadHold: 1, //if the distance between current pos and pos after recoil is lower
                                    //than the threadhold, it will just move the distance between those point
    recoilDecayingPercentage: 0.10, //percentage of the recoil that actually got affected each draw


    //properties related to the zooming toward the mouse the further the cursor are from the middle
    //of the screen

    zoomingAwayTowardMouseAngleCheck: false,
    lowestZoom: 10, //lowest amount that could be applied, no matter how far is mouse.distance

    //fomula used to calculate the higest posible zoom, reached when the player move the cursor at or over
    //distanceForMaxedZoom.
    //highest zoom is a half of the shorter screen minus 1 and a half of the body size (the a half is needed
    //to move the highest zoom from having half of the body on higest case to having full body on screen)
    //the minus lowestZoom is to ensure that highest zoom is actually at highest zoom and not increased by
    //the adding of the lowest zoom
    //eval at load => see preload code
    highestZoom: "(giveShorterSideBetweenWidthAndHeight() / 2 - (body.size * 1.5)) - position.lowestZoom",

    //the distance from the center of screen to what ever this value is, used to keep track of mouse.distance
    //to apply zoom, the further the mouse.distance is. if higher or equal to this, the highest zoom
    //is applied
    //eval at load => see preload code
    distanceForMaxedZoom: "0.5 * (giveShorterSideBetweenWidthAndHeight() / 2)",


    //check if an object is inside the player screen, return true if yes
    insideCameraFOVCheck(xPositionOnScreen, yPositionOnScreen, sizeX, sizeY)
    {
        const zoomingShift = this.getDrawPositionShiftedFromZooming();

        //the lowest and highest posible x and y value that an object have to be in
        //in order to appear in player screen

        /*

        showing how rightMostXValueFromCenter is calculated:
        
        . => center

                           _____
                          |     |
        graphic object => |_____|

             window.innerWidth
        <==========================>
        ____________________________
        |                          |
        |    window.innerWidth / 2 |
        |            .<===========>|
        |                          |
        |                          | sizeX / 2
        |                          |<=>
        |                          |_____
        |                          |  .  |
        |                          |_____|   <== graphic object
        |                          |<===>
        |                          | sizeX
        |                          |
        |            .<============|==>
        |                          | (window.innerWidth / 2) + (sizeX / 2)
        |__________________________|
        */

        const leftMostXValueFromCenter = 0 + switchSign(sizeX / 2);
        const rightMostXValueFromCenter = window.innerWidth + (sizeX / 2);
        const upMostYValueFromCenter = 0 + switchSign(sizeY / 2);
        const downMostYValueFromCenter = window.innerHeight + (sizeY / 2);

        //if the graphic object x and y is inside the most left and right posible barrier, and the most top
        //and bottom barrier, the object is in the player FOV
        if((leftMostXValueFromCenter < xPositionOnScreen && xPositionOnScreen < rightMostXValueFromCenter) && (upMostYValueFromCenter < yPositionOnScreen && yPositionOnScreen < downMostYValueFromCenter))
        {
            return true;
        }
        else
        {
            return false;
        }
    },

    //converting world position to position on screen
    convertToScreenXY(worldX, worldY)
    {
        let screenX = worldX - this.x;
        let screenY = worldY - this.y;

        screenY = switchSign(screenY); //flip the sign since y in browser is lower as u move up
                                       //and higher going down

        //move to the middle of the screen since top left is 0, 0 and not at the center
        screenX += window.innerWidth / 2;
        screenY += window.innerHeight / 2;

        return {x: screenX, y: screenY};

        /*
        how is this work?
        dunno, but let test all the posible cases:

        1. object x is in the negative zone:
            1) player x is in the positive:
                object x: -10
                player x: 10
                
                    ?
                <=======
                O   0   P
               -10     10

                -10 - 10 = -20

            2) player x is at 0:
                object x: -10
                player x: 0
                
                  ?
                <====
                O   P
               -10  0

                -10 - 0 = -10

            3) player x is in the negative:
                1/ player is left of object:
                    object x: -10
                    player x: -20
                    
                  ?
                ====>
                P   O   0
               -20 -10

                    -10 - - 20 = 10

                2/ player is right of object:
                    object x: -10
                    player x: -5

                      ?
                    <===
                    O  P  0
                   -10 -5

                    -10 - - 5 = -5

        2. object x is at 0:
            1) player x is in the negative:
                object x: 0
                player x: -10

                      ?
                    ====>
                    P   O
                   -10  0

                0 - - 10 = 10

            2) player x is in the positive:
                object x: 0
                player x: 10

                          ?
                        <====
                        O   P
                        0   10

                0 - 10 = -10
                
        3. object x is in the positive zone:
            1) player x is in the positive:
                1/ player is left of object:
                    object x: 10
                    player x: 5
                    
                      ?
                    ====>
                0   P   O
                    5   10

                    10 - 5 = 5

                2/ player is right of object:
                    object x: 10
                    player x: 20

                      ?
                    <====
                0   O   P
                    10  20

                    10 - 20 = -10
                
            2) player x is at 0:
                object x: 10
                player x: 0
                
                  ?
                ====>
                P   O
                0  10

                10 - 0 = 10

            3) player x is in the negative:
                object x: 10
                player x: -10
                
                    ?
                ========>
                P   0   O
               -10     10

                10 - - 10 = 20
        */
    },

    //return the x and y change from recoil
    getCoordinateChangeWhenRecoil()
    {
        //get the distance that needed to move due to the recoil
        const movingDistance = getDistanceWithCoordinate(position.x, position.y, position.xPositionAfterRecoil, position.yPositionAfterRecoil);
        //get the angle needed to move due to the recoil
        const movingAngle = getAngleToAimUsingTargetAndAimerCoordinate(position.x, position.y, position.xPositionAfterRecoil, position.yPositionAfterRecoil);

        //get the moving distance that the player actually moved to make the recoil appearing smoother
        //if the distance needed to move is higher than the cut off threadhold, a percentage is applied
        //to the moving distance to make it smaller and make it appeared smoother and not teleporty
        //if the distance is lower than the threadhold then just moved the needed distance without
        //the percentage
        const movingAmount = movingDistance > this.recoilDistanceThreadHold ? movingDistance * this.recoilDecayingPercentage : movingDistance;

        //return an obj that hold the position change
        return {x: Math.cos(movingAngle) * movingAmount, y: Math.sin(movingAngle) * movingAmount};
    },

    //give out shifts in x and y postion oh graphical object when draw due to zooming
    getDrawPositionShiftedFromZooming()
    {
        //get how much zoom is provided per pixle of distance in mouse.distance
        const zoomingPerPixle = this.highestZoom / this.distanceForMaxedZoom;

        //check if mouse distance is smaller than the longest range that u can go to have highestZoom,
        //distanceForMaxedZoom, and if it is, time mouse distance with the zooming per pixel ratio to get
        //the zoomed distance, else if the mouse distance is way higher than the needed range, just time
        //zoomingPerPixle with distanceForMaxedZoom to not allow the player to zoom higher
        let zoomDistance = mouse.distance < this.distanceForMaxedZoom ? zoomingPerPixle * mouse.distance : zoomingPerPixle * this.distanceForMaxedZoom;

        zoomDistance += this.lowestZoom; //add lowestZoom to ensure that even if mouse.distance is close to
                                         //0, the zoom would be at least equal to lowest zoom

        if(this.zoomingAwayTowardMouseAngleCheck) //check if zooming is enable to actually apply the
                                                  //transition from the zooming
        {
            //return the transition in x and y
            return {x: Math.cos(mouse.angle + Math.PI) * zoomDistance, y: Math.sin(mouse.angle + Math.PI) * zoomDistance};
        }
        else
        {
            //just return 0
            return {x: 0, y: 0};
        }
    }
};

//object used to store everything about keyboard input
const key =
{
    list: //list of all the useable key
    [
        "w",
        "a",
        "s",
        "d",
        "ArrowUp",
        "ArrowDown",
        "ArrowRight",
        "ArrowLeft",
        ";"
    ],

    upKeys: ["w", "ArrowUp"], //keys used to move up
    downKeys: ["s", "ArrowDown"], //keys used to move down
    rightKeys: ["d", "ArrowRight"], //keys used to move right
    leftKeys: ["a", "ArrowLeft"], //keys used to move left
};


//graphic object, all is being drawn in draw() by calling the obj draw() method

//Note: make sure to include "imgSource" as properties to the object when the object used an image as graphic
//Note: make sure to also have "imageSource" as parameter in draw() method to get the image after loaded

//obj that store everything about the background
const background = 
{
    size: 300, //any number under 100 will nuke the PC lol

    imgSource: "texture.svg",

    color: "255, 255, 255", //color of the background when drawn in plain style

    plainOrImage: true, //used to check if the background is drawn in a plain style or used an image
                         //true if plain and false if image
    
    toggleBorder: true,
    borderColor: "105, 105, 108", //default look color is "105, 105, 108"
                                //forest background color is "72, 198, 72"
    borderThickness: 5,

    /*
    if using an image background, to turn off border:
    1. set toggleBorder to true
    2. set borderThickness to 1
    3. set borderColor to the same color at the edge of the image
    ex: if at the very edge of the image is green, set the border color to green
    */


    startAtMiddleOrAtCross: true, //true for starting in the middle of the square, false for at cross


    draw(imageSource)
    {
        const zoomingShift = position.getDrawPositionShiftedFromZooming();

        const offsetX = (position.x - zoomingShift.x) % this.size;
        const offsetY = (switchSign(position.y) - zoomingShift.y) % this.size; //since the browser have - as up and + as down
                                                            //the number stored in position.y will need
                                                            //switchSign() when used

        const drawTitles = (x, y) => 
        {
            //offset are small shift to the background when drawing due to player moving around
            x -= offsetX;
            y -= offsetY;

            if(this.startAtMiddleOrAtCross) //move the player from middle of cross to middle of background
                                            //by moving from top left of back ground to middle of background
            {
                x += this.size / 2;
                y += this.size / 2;
            }

            //fill the style or draw the image
            if(this.plainOrImage)
            {
                drawing.fillStyle = `rgb(${this.color})`;

                drawing.fillRect(x, y, this.size, this.size); //plain background
            }
            else
            {
                drawing.drawImage(imageSource, x, y, this.size, this.size); //image background
            }

            //draw border if toggleBorder is true
            if(this.toggleBorder)
            {
                drawing.strokeStyle = `rgb(${this.borderColor})`;
                drawing.lineWidth = this.borderThickness;
                drawing.strokeRect(x, y, this.size, this.size);
            }
        };


        //variable that store how much background can be placed from the middle of the screen, but not counting
        //the one in the middle of the screen, to the right and top edge of the screen. used later to keep
        //track of the range of background needed to draw.

        //look at drawing for better understand cuz i didn't when i made this lol

        //1 => xNumOfBackGroundFromMidToEdge, 2 => yNumOfBackGroundFromMidToEdge
        //pretending that "." is the center lol

        //        2
        // ______________
        // |      /\     |
        // |      ||     |
        // |      \/     |
        // |      .<====>|  1
        // |_____________|

        //the 2 variable hold the result after finding how many piece of background can fit in 1 and 2 distance

        const xNumOfBackGroundFromMidToEdge = Math.ceil(((window.innerWidth / 2) - (this.size / 2)) / this.size);
        const yNumOfBackGroundFromMidToEdge = Math.ceil(((window.innerHeight / 2) - (this.size / 2)) / this.size);

        //dunno why this is here but it work with it so...
        const startErrorMargin = -2; //used to prevent undraw background due to crossing into negative num and
                                    //zero. on top and left corner

        const endErrorMargin = this.startAtMiddleOrAtCross ? 0 : 1; //used to prevent undraw background due to
                                                                    //crossing into positive num. on bottom and
                                                                    //right corner. only if (0, 0) is a cross

        drawing.save();

        //drawing along the y axis
        for(let countY = switchSign(yNumOfBackGroundFromMidToEdge) + startErrorMargin; countY <= yNumOfBackGroundFromMidToEdge + endErrorMargin; countY++)
        {
            //drawing along the x axis
            for(let countX = switchSign(xNumOfBackGroundFromMidToEdge) + startErrorMargin; countX <= xNumOfBackGroundFromMidToEdge + endErrorMargin; countX++)
            {
                drawTitles((this.size * countX) + (window.innerWidth / 2), (this.size * countY) + (window.innerHeight / 2));
            }
        }

        drawing.restore();
    }
};

//obj that store everything about bullets
const bullet = 
{
    size: 20, //make sure to have this the same size as gun.sizeY
    color: "60, 164, 203",
    borderColor: "67, 104, 117",
    borderThickness: 2.5,
    
    
    speed: 10, //the moving speed of the bullet
    reload: 500, //the delay between shoot, or reload
    despawningTime: 750, //the time limit that when this bullet reached, it will get bigger,
                            //fading away, and despawning the bullet


    reloadCheck: true, //check for if the gun is reloaded
    reloadTimer: 0, //used to keep track wherever the current time had passed the required reload time to fire
    
    
    list: [], //list that store all the bullet


    //change when reached despawningTime

    //highestOpacity have to be higher than lowestOpacity
    highestOpacity: 1,
    lowestOpacity: 0,

    //highestSizeMultiplier have to be higher than lowestSizeMultiplier
    highestSizeMultiplier: 2,
    lowestSizeMultiplier: 1,

    durationForOpacityAndSizeChangeBeforeDespawn: 200, //the time that the bullet transist from growing and
                                                       //fading to despawn entirely

    //time from bullet spawn to despawn = despawningTime + durationForOpacityAndSizeChangeBeforeDespawn


    //function used to draw bullet(s)
    draw() 
    {
        const drawEachBullet = (x, y, opacity, sizeMultiplier) => //function for drawing each bullet
        {
            const zoomingShift = position.getDrawPositionShiftedFromZooming();
            const positionFromMiddleOfScreen = position.convertToScreenXY(x, y); //get the bullet position
                                                                                 //on screen
            //check if the bullet is even in the player FOV and if true, draw it
            if(position.insideCameraFOVCheck(positionFromMiddleOfScreen.x + zoomingShift.x, positionFromMiddleOfScreen.y + zoomingShift.y, this.size * sizeMultiplier , this.size * sizeMultiplier))
            {
                drawing.save();

                //fill part

                drawing.fillStyle = `rgba(${this.color}, ${opacity})`;

                drawing.beginPath();
                drawing.arc(positionFromMiddleOfScreen.x + zoomingShift.x, positionFromMiddleOfScreen.y + zoomingShift.y, (this.size * sizeMultiplier) / 2, 0, Math.PI * 2);
                drawing.fill();

                //border part
                drawing.strokeStyle = `rgba(${this.borderColor}, ${opacity})`;
                drawing.lineWidth = this.borderThickness;

                drawing.stroke();
                drawing.closePath();

                drawing.restore();
            }
        }

        for(let i = this.list.length - 1; i >= 0; i--) //need to run from the end of the list to the start to
                                                       //ensure that the older bullet is drawing on top of
                                                       //newer ones
        {
            if((Date.now() - this.list[i].time) >= this.despawningTime) //check if the bullet reached the
                                                                        //despawning time
            {
                //used to keep track of the amount of time that the bullet passed after passing the despawning
                //time
                const timeAfterPassingDespawningTime = (Date.now() - (this.list[i].time + this.despawningTime));

                //store the ration between timeAfterPassingDespawningTime and the highest amount of time
                //that the bullet can reach, where it will be despawn when reached.
                //used for creating animation just before the bullet got despawn
                const ratioBetweenTimePassedAndMaxDuration = timeAfterPassingDespawningTime / this.durationForOpacityAndSizeChangeBeforeDespawn;

                if((ratioBetweenTimePassedAndMaxDuration) >= 1) //if it is higher or equal to the maxed
                                                                //duration, just set the opacity and size
                                                                //multiplier to the lowest posible
                {
                    this.list[i].opacity = this.lowestOpacity;
                    this.list[i].sizeMultiplier = this.highestSizeMultiplier;
                }
                else
                {
                    //to understand the fomular, just look at the situation when the highest and lowest
                    //posible value occured

                    /*
                    highest posible value = x
                    lowest posible value = y

                    opacity highest situation: x - ((x - y) * 1) => x - (x - y) => x + -x + y => y
                    opacity lowest situation: x - ((x - y) * 0) => x - 0 => x

                    size multiplier highest situation: y + ((x - y) * 1) => y + (x - y) => y + x - y => x
                    size multiplier lowest situation: y + ((x - y) * 0) => y + 0 => y

                    ye, it just work... don't ask lol
                    */

                    this.list[i].opacity = this.highestOpacity - ((this.highestOpacity - this.lowestOpacity) * (ratioBetweenTimePassedAndMaxDuration));
                    this.list[i].sizeMultiplier = this.lowestSizeMultiplier + ((this.highestSizeMultiplier - this.lowestSizeMultiplier) * (ratioBetweenTimePassedAndMaxDuration));
                }
            }

            //add the change in speed to the current bullet

            this.list[i].x += Math.cos(this.list[i].angle) * this.speed;
            this.list[i].y += -1 * Math.sin(this.list[i].angle) * this.speed;

            //draw each bullet...
            drawEachBullet(this.list[i].x, this.list[i].y, this.list[i].opacity, this.list[i].sizeMultiplier);

            //if the current bullet alr reached or passed its despawn time, just cut it out of bullet.list
            if((Date.now() - this.list[i].time) >= (this.despawningTime + this.durationForOpacityAndSizeChangeBeforeDespawn))
            {
                this.list.splice(i, 1);
            }
        }
    }
};

//obj that store everything about da gun
const gun = 
{
    /*
    ______________
    |      /\     |
    |sizeY ||     |
    |      \/     |    <== totally a gun lol
    |_____________|
    <=============>
        sizeX
    */

    sizeX: 60,
    sizeY: 20, //make sure to have this the same size as bullet.size
    color: "167, 167, 175", //the fill color of the gun
    borderColor: "105, 105, 108",
    borderThickness: 2.5,

    recoil: 100,
    recoilCheck: false,


    draw()
    {
        const zoomingShift = position.getDrawPositionShiftedFromZooming();

        drawing.save();

        drawing.translate(window.innerWidth / 2 + zoomingShift.x, window.innerHeight / 2 + zoomingShift.y); //move to the center of the screen

        drawing.rotate(mouse.angle); //rotated toward the mouse

        //also canvas is being weird and alr taken account for the rotation and shifted it up lol
        drawing.translate(0, this.sizeY / -2); //move the gun up from being centered at top left corner to
                                               //middle left

        //fill

        drawing.fillStyle = `rgb(${this.color})`;
        drawing.fillRect(0, 0, this.sizeX, this.sizeY);

        //border

        drawing.strokeStyle = `rgb(${this.borderColor})`;
        drawing.lineWidth = this.borderThickness;
        drawing.strokeRect(0, 0, this.sizeX, this.sizeY);

        drawing.restore();
    }
};

//obj that store everything about player body
const body = 
{
    size: 60,
    color: "60, 164, 203",
    borderColor: "67, 104, 117",
    borderThickness: 2.5,


    draw()
    {
        const zoomingShift = position.getDrawPositionShiftedFromZooming();

        drawing.save();

        //fill
        drawing.fillStyle = `rgb(${this.color})`;
        drawing.beginPath();
        drawing.arc(window.innerWidth / 2 + zoomingShift.x, window.innerHeight / 2 + zoomingShift.y, this.size / 2, 0, Math.PI * 2);
        drawing.fill();

        //border
        drawing.strokeStyle = `rgb(${this.borderColor})`;
        drawing.lineWidth = this.borderThickness;
        drawing.stroke();
        drawing.closePath();

        drawing.restore();
    }
};

//obj that store everything about the crosshair
const crosshair =
{
    size: 50,
    imgSource: "crosshair.svg", //source of the image


    draw(imageSource)
    {
        drawing.save();

        drawing.translate(mouse.x, mouse.y); //move to mouse position 

        //draw the image after shifting it left and up to move the cross hair in the middle of the cursor
        drawing.drawImage(imageSource, this.size / -2, this.size / -2, this.size, this.size);

        drawing.restore();
    }
};

//GameText obj

//Note: fontSize determined the y value of each letter

//GameText obj that used to draw texts with information about FPS and delay each frame
const GameText_fpsAndDelayEachFrame = new GameText
(
    "", //text
    "window.innerWidth - 5", //getXFomula
    "window.innerHeight - 5", //getYFomula
    12, //fontSize
    "right", //textAlign
    true, //boldToggle
    false, //italicToggle
    "255, 255, 255", //color
    true, //borderToggle
    "0, 0, 0", //borderColor
    3, //borderThickness
    true //toggleCondition
);

//GameText obj that used to draw texts with information about the position of player in the world
const GameText_showPosition = new GameText
(
    `x: ${position.x}, y: ${position.y}`, //text
    "window.innerWidth - 5", //getXFomula
    "window.innerHeight - 20", //getYFomula
    12, //fontSize
    "right", //textAlign
    true, //boldToggle
    false, //italicToggle
    "255, 255, 255", //color
    true, //borderToggle
    "0, 0, 0", //borderColor
    3, //borderThickness
    true //toggleCondition
);


//GUI layer

//list of thing that will be drew in order, one with lower layer count is lower in GUI layer
//take in all the graphical objects

const guiLayer = 
[
    //bottom => background

    background, //layer 0
    bullet, //layer 1
    gun, //layer 2
    body, //layer 3
    GameText_fpsAndDelayEachFrame, //layer 4
    GameText_showPosition, //layer 5
    crosshair //layer 6

    //top => crosshair
];


// event listeners

document.addEventListener('mousemove', (event) => 
{
    //get pos of mouse
    mouse.x = event.clientX;
    mouse.y = event.clientY;

    //get the angle that the cursor had rotated, with the center of the screen being the origin
    mouse.angle = Math.atan2(mouse.y - (window.innerHeight / 2), mouse.x - (window.innerWidth / 2));

    mouse.distance = getDistanceWithCoordinate(window.innerWidth / 2, window.innerHeight / 2, mouse.x, mouse.y);
});


document.addEventListener("keydown", (event) => 
{
    const input = event.key.toLowerCase();

    if(key.list.includes(input))
    {
        if(key.upKeys.includes(input))
        {
            position.up = true;

            if(position.down === true)
            {
                position.upIsNewDirection = true;
                position.downIsNewDirection = false;

                position.oppositeY = true;
            }
        }
        
        if(key.downKeys.includes(input))
        {
            position.down = true;

            if(position.up === true)
            {
                position.downIsNewDirection = true;
                position.upIsNewDirection = false;

                position.oppositeY = true;
            }
        }

        if(key.leftKeys.includes(input))
        {
            position.left = true;

            if(position.right === true)
            {
                position.leftIsNewDirection = true;
                position.rightIsNewDirection = false;

                position.oppositeX = true;
            }
        }
        
        if(key.rightKeys.includes(input))
        {
            position.right = true;

            if(position.left === true)
            {
                position.rightIsNewDirection = true;
                position.leftIsNewDirection = false;

                position.oppositeX = true;
            }
        }

        if(input === ";" && !fpsAndDrawDelay.semicolonDownedCheck)
        {
            GameText_fpsAndDelayEachFrame.toggleCondition = !GameText_fpsAndDelayEachFrame.toggleCondition;
            GameText_showPosition.toggleCondition = !GameText_showPosition.toggleCondition;
            fpsAndDrawDelay.semicolonDownedCheck = true;
        }
    }
});

document.addEventListener("keyup", (event) => 
{
    const input = event.key.toLowerCase();
    if(key.list.includes(input))
    {
        if(key.upKeys.includes(input))
        {
            position.up = false;

            position.upIsNewDirection = false;

            position.oppositeY = false;
        }

        if(key.downKeys.includes(input))
        {
            position.down = false;

            position.downIsNewDirection = false;

            position.oppositeY = false;
        }

        if(key.rightKeys.includes(input))
        {
            position.right = false;

            position.rightIsNewDirection = false;

            position.oppositeX = false;
        }

        if(key.leftKeys.includes(input))
        {
            position.left = false;

            position.leftIsNewDirection = false;

            position.oppositeX = false;
        }

        if(input === ";")
        {
            fpsAndDrawDelay.semicolonDownedCheck = false;
        }
    }
});


document.addEventListener("mousedown", (event) => 
{
    if(event.button === 0)
    {
        mouse.leftHoldDown = true;
        position.zoomAdjustCheck = true;
    }
    else if(event.button === 2)
    {
        mouse.rightHoldDown = true;
    }
});

document.addEventListener("mouseup", (event) => 
{
    if(event.button === 0)
    {
        mouse.leftHoldDown = false;
    }
    else if(event.button === 2)
    {
        mouse.rightHoldDown = false;
    }
});

window.addEventListener("resize", () => 
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    adjustGameTextPositionWhenScreenResize();
});

document.addEventListener("contextmenu", (event) => 
{
    event.preventDefault();
});


// functions

//function related to the program

//used for drawing all graphical object
function draw() 
{
    drawing.clearRect(0, 0, canvas.width, canvas.height);  //clear canvas at the first of each frame


    //code related to keeping track of bullet reload and creating new bullet when clicking
    if(mouse.leftHoldDown && bullet.reloadCheck) //shooting bullet when mouse is down
    {
        //create new bullet
        bullet.list[bullet.list.length] = 
        {
            x: (position.x) + (Math.cos(mouse.angle) * gun.sizeX),
            y: (position.y) + (-1 * Math.sin(mouse.angle) * gun.sizeX),
            angle: mouse.angle,
            time: Date.now(),
            opacity: bullet.highestOpacity,
            sizeMultiplier: bullet.lowestSizeMultiplier
        };

        bullet.reloadCheck = false;
        bullet.reloadTimer = Date.now();


        //recoil
        gun.recoilCheck = true;
    }

    if(Date.now() - bullet.reloadTimer >= bullet.reload)
    {
        bullet.reloadCheck = true;
    }


    if(mouse.rightHoldDown)
    {
        position.zoomingAwayTowardMouseAngleCheck = true;
    }
    else
    {
        position.zoomingAwayTowardMouseAngleCheck = false;
    }


    //code related to movement
    changePosition();


    GameText_showPosition.text = `x: ${position.x.toFixed(2)}, y: ${position.y.toFixed(2)}`;


    //code for drawing each object in the GUI layer
    for(let layer = 0; layer < guiLayer.length; layer++)
    {
        if(imageSourceList.includes(guiLayer[layer].imgSource))
        {
            guiLayer[layer].draw(imageStorage[imageSourceList.indexOf(guiLayer[layer].imgSource)]);
        }
        else
        {
            guiLayer[layer].draw();
        }
    }


    //code related to getting FPS and delayed time between frame
    if(Date.now() - fpsAndDrawDelay.delayTracker >= fpsAndDrawDelay.timeDelayedBetweenDraw || isNaN(fpsAndDrawDelay.delayTracker))
    {
        if(Date.now() - fpsAndDrawDelay.delayTracker >= fpsAndDrawDelay.timeDelayedBetweenDraw)
        {
            GameText_fpsAndDelayEachFrame.text = calculateFps(Number((fpsAndDrawDelay.accumulatedDelayedTime / fpsAndDrawDelay.framePassed).toFixed(2)));
        }
        else
        {
            GameText_fpsAndDelayEachFrame.text = "Calculating...";
        }

        fpsAndDrawDelay.accumulatedDelayedTime = 0;
        fpsAndDrawDelay.framePassed = 0;

        fpsAndDrawDelay.delayTracker = Date.now();
    }

    fpsAndDrawDelay.accumulatedDelayedTime += Date.now() - fpsAndDrawDelay.delayedTime;
    fpsAndDrawDelay.framePassed++;

    fpsAndDrawDelay.delayedTime = Date.now();


    //code that ensure that draw() is repeated forever to draw all the time
    requestAnimationFrame(draw);
}

//used for calculating FPS
function calculateFps(delayBetweenFrame)
{
    return `${(1000 / delayBetweenFrame).toFixed(2)} FPS | Draw Delay: ${delayBetweenFrame}`;
}

//used for updating player position
function changePosition()
{

    if(gun.recoilCheck)
    {
        position.xPositionAfterRecoil += Math.cos(mouse.angle + Math.PI) * gun.recoil;
        position.yPositionAfterRecoil += -1 * Math.sin(mouse.angle + Math.PI) * gun.recoil;

        gun.recoilCheck = false;
    }

    if(position.up && position.right && (!(position.down || position.left) || position.moveWhenOppositeDirection && ((!position.oppositeX || position.oppositeX && position.rightIsNewDirection) && (!position.oppositeY || position.oppositeY && position.upIsNewDirection))))
    {
        position.x += position.speed * Math.SQRT1_2;
        position.y += position.speed * Math.SQRT1_2;
        position.xPositionAfterRecoil += position.speed * Math.SQRT1_2;
        position.yPositionAfterRecoil += position.speed * Math.SQRT1_2;
    }
    else if(position.up && position.left && (!(position.down || position.right) || position.moveWhenOppositeDirection && ((!position.oppositeX || position.oppositeX && position.leftIsNewDirection) && (!position.oppositeY || position.oppositeY && position.upIsNewDirection))))
    {
        position.x -= position.speed * Math.SQRT1_2;
        position.y += position.speed * Math.SQRT1_2;
        position.xPositionAfterRecoil -= position.speed * Math.SQRT1_2;
        position.yPositionAfterRecoil += position.speed * Math.SQRT1_2;
    }
    else if(position.down && position.right && (!(position.up || position.left) || position.moveWhenOppositeDirection && ((!position.oppositeX || position.oppositeX && position.rightIsNewDirection) && (!position.oppositeY || position.oppositeY && position.downIsNewDirection))))
    {
        position.x += position.speed * Math.SQRT1_2;
        position.y -= position.speed * Math.SQRT1_2;
        position.xPositionAfterRecoil += position.speed * Math.SQRT1_2;
        position.yPositionAfterRecoil -= position.speed * Math.SQRT1_2;
    }
    else if(position.down && position.left && (!(position.up || position.right) || position.moveWhenOppositeDirection && ((!position.oppositeX || position.oppositeX && position.leftIsNewDirection) && (!position.oppositeY || position.oppositeY && position.downIsNewDirection))))
    {
        position.x -= position.speed * Math.SQRT1_2;
        position.y -= position.speed * Math.SQRT1_2;
        position.xPositionAfterRecoil -= position.speed * Math.SQRT1_2;
        position.yPositionAfterRecoil -= position.speed * Math.SQRT1_2;
    }
    else if(position.right && (!position.left || (position.moveWhenOppositeDirection && (!position.oppositeX || (position.oppositeX && position.rightIsNewDirection)))))
    {
        position.x += position.speed;
        position.xPositionAfterRecoil += position.speed;
    }
    else if(position.left && (!position.right || (position.moveWhenOppositeDirection && (!position.oppositeX || (position.oppositeX && position.leftIsNewDirection)))))
    {
        position.x -= position.speed;
        position.xPositionAfterRecoil -= position.speed;
    }
    else if(position.up && (!position.down || (position.moveWhenOppositeDirection && (!position.oppositeY || (position.oppositeY && position.upIsNewDirection)))))
    {
        position.y += position.speed;
        position.yPositionAfterRecoil += position.speed;
    }
    else if(position.down && (!position.up || (position.moveWhenOppositeDirection && (!position.oppositeY || (position.oppositeY && position.downIsNewDirection)))))
    {
        position.y -= position.speed;
        position.yPositionAfterRecoil -= position.speed;
    }

    const recoilChange = position.getCoordinateChangeWhenRecoil();

    position.x += recoilChange.x;
    position.y += recoilChange.y;
}

//used for recursively load up all the image in the game
function setupImg(i)
{
    if(i < imageSourceList.length)
    {
        const image = new Image();

        image.addEventListener("load", () => 
        {
            setupImg(i + 1);
        });

        image.src = imageSourceList[i];

        imageStorage.push(image);
    }
    else
    {
        draw();
    }
}

//used for adjusting text position and screen is resized
function adjustGameTextPositionWhenScreenResize()
{
    for(let i = 0; i < GameText.instanceList.length; i++)
    {
        GameText.instanceList[i].adjustPositionWhenResize();
    }
}

function giveShorterSideBetweenWidthAndHeight()
{
    return window.innerHeight <= window.innerWidth ? window.innerHeight : window.innerWidth;
}


//function for calculating math

function getDistanceWithCoordinate(aimerX, aimerY, targetX, targetY)
{
    const changeInX = aimerX - targetX;
    const changeInY = aimerY - targetY;

    return Math.sqrt((changeInX * changeInX) + (changeInY * changeInY));
}

function getAngleToAimUsingTargetAndAimerCoordinate(aimerX, aimerY, targetX, targetY)
{
    return Math.atan2(targetY - aimerY, targetX - aimerX);
}

function switchSign(num)
{
    return num * -1;
}

function giveRandomVal(maxValue, minValue, decimalOrInteger) //give random number between the
                                                             //inputed maxValue and minValue (1st and 2nd arg)
                                                             //if decimalOrInteger is true, return float
                                                             //else false, return int

                                                             //Note: if returning float, the range is not
                                                             //containing the maxValue and minValue
{
    if(decimalOrInteger)
    {
        return Math.random() * (maxValue - minValue) + minValue;
    }
    else
    {
        return Math.floor(Math.random() * (maxValue - minValue + 1) + minValue);
    }
}


//preload code

//set up initial position
if(position.randomizedSpawn)
{
    position.x = giveRandomVal(position.highestRandomX, position.lowestRandomX, position.floatRandomizeSpawnPosition);
    position.y = giveRandomVal(position.highestRandomY, position.lowestRandomY, position.floatRandomizeSpawnPosition);

    position.xPositionAfterRecoil = position.x;
    position.yPositionAfterRecoil = position.y;
}

position.highestZoom = eval(position.highestZoom);
position.distanceForMaxedZoom = eval(position.distanceForMaxedZoom);

const imageSourceList = []; //store all the source here in string form. need to be empty.
                            //will be filled later in the next for loop
const imageStorage = []; //store all the reference to the Image obj. need to be empty.
                         //will be filled later in setupImg()

for(let i = 0; i < guiLayer.length; i++)
{
    if(guiLayer[i].imgSource)
    {
        imageSourceList.push(guiLayer[i].imgSource);
    }
}

setupImg(0);