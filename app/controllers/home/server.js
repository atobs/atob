"use strict";

var Board = require_app("models/board");

var Sequelize = require("sequelize");
var $ = require("cheerio");
var ArchivedPost = require_app("models/archived_post");
var Post = require_app("models/post");
var gen_md5 = require_app("server/md5");

var ICONS = [
  "aaabattery", "abacus", "accountfilter", "acsource", "addfriend", "address",
  "addshape", "addtocart", "addtolist", "adjust", "adobe", "ads-bilboard",
  "affiliate", "ajax", "alarm", "alarmalt", "album-cover", "alertalt",
  "alertpay", "algorhythm", "alienship", "alienware", "align-center",
  "align-justify", "align-left", "align-right", "alignbottomedge",
  "alignhorizontalcenter", "alignleftedge", "alignrightedge", "aligntopedge",
  "alignverticalcenter", "amd", "analogdown", "analogleft", "analogright",
  "analogup", "analytics-piechart", "analyticsalt-piechartalt", "anchor-port",
  "android", "angrybirds", "antenna", "apache-feather", "aperture",
  "appointment-agenda", "archive", "arrow-down", "arrow-left", "arrow-right",
  "arrow-up", "asterisk", "asteriskalt", "at", "atari",
  "authentication-keyalt", "automobile-car", "autorespond", "avatar",
  "avataralt", "avengers", "awstats", "axe", "backup-vault",
  "backupalt-vaultalt", "backupwizard", "backward", "bag", "baloon",
  "ban-circle", "banana", "bandwidth", "bank", "barchart", "barchartalt",
  "barcode", "basecamp", "basketball", "bat", "batman", "batteryaltcharging",
  "batteryaltfull", "batteryaltsixty", "batteryaltthird", "batterycharged",
  "batterycharging", "batteryeighty", "batteryempty", "batteryforty",
  "batteryfull", "batterysixty", "batterytwenty", "bed", "beer", "bell",
  "bigger", "bill", "binary", "binoculars-searchalt", "birdhouse", "birthday",
  "bishop", "blackberry", "blankstare", "blogger-blog", "bluetooth",
  "bluetoothconnected", "boardgame", "boat", "bold", "bomb", "bone", "book",
  "bookmark", "boombox", "bottle", "bow", "bowling", "bowlingpins", "bowtie",
  "boxtrapper-mousetrap", "braces", "braille0", "braille1", "braille2",
  "braille3", "braille4", "braille5", "braille6", "braille7", "braille8",
  "braille9", "braillea", "brailleb", "braillec", "brailled", "braillee",
  "braillef", "brailleg", "brailleh", "braillei", "braillej", "braillek",
  "braillel", "braillem", "braillen", "brailleo", "braillep", "brailleq",
  "brailler", "brailles", "braillespace", "braillet", "brailleu", "braillev",
  "braillew", "braillex", "brailley", "braillez", "brain", "bread",
  "breakable", "briefcase", "briefcasethree", "briefcasetwo", "brightness",
  "brightnessfull", "brightnesshalf", "broom", "browser", "brush", "bucket",
  "bug", "bullhorn", "bus", "businesscardalt", "buttona", "buttonb", "buttonx",
  "buttony", "cactus-desert", "calculator", "calculatoralt", "calendar",
  "calendaralt-cronjobs", "camera", "candle", "candy", "candycane", "cannon",
  "canvas", "canvasrulers", "capacitator", "capslock", "captainamerica",
  "carrot", "cashregister", "cassette", "cd-dvd", "certificate",
  "certificatealt", "certificatethree", "cgi", "cgicenter", "chair", "chat",
  "check", "checkboxalt", "checkin", "checkinalt", "chef", "cherry",
  "chevron-down", "chevron-left", "chevron-right", "chevron-up", "chevrons",
  "chicken", "chocolate", "christiancross", "christmastree", "chrome",
  "cigarette", "circle-arrow-down", "circle-arrow-left", "circle-arrow-right",
  "circle-arrow-up", "circleadd", "circledelete", "circledown", "circleleft",
  "circleright", "circleselect", "circleselection", "circleup",
  "clearformatting", "clipboard-paste", "clockalt-timealt", "closetab",
  "closewindow", "cloud", "clouddownload", "cloudhosting", "cloudsync",
  "cloudupload", "clubs", "cmd", "cms", "cmsmadesimple", "codeigniter",
  "coffee", "coffeebean", "cog", "colocation", "colocationalt", "colors",
  "comment", "commentout", "commentround", "commentroundempty",
  "commentroundtyping", "commentroundtypingempty", "commenttyping", "compass",
  "concretefive", "contact-businesscard", "controllernes", "controllerps",
  "controllersnes", "controlpanel", "controlpanelalt", "cooling", "coppermine",
  "copy", "copyright", "coupon", "cpanel", "cplusplus", "cpu-processor",
  "cpualt-processoralt", "crayon", "createfile", "createfolder",
  "creativecommons", "creditcard", "cricket", "croisant", "crop", "crown",
  "csharp", "cssthree", "cup-coffeealt", "cupcake", "curling", "cursor",
  "cut-scissors", "dagger", "danger", "dart", "darthvader", "database",
  "databaseadd", "databasedelete", "davidstar", "dcsource", "dedicatedserver",
  "deletefile", "deletefolder", "delicious", "designcontest", "desklamp",
  "dialpad", "diamond", "diamonds", "die-dice", "diefive", "diefour", "dieone",
  "diesix", "diethree", "dietwo", "diode", "director", "diskspace",
  "distributehorizontalcenters", "distributeverticalcenters", "divide", "dna",
  "dnszone", "document", "doghouse", "dollar", "dollaralt", "dolphinsoftware",
  "domain", "domainaddon", "domino", "donut", "downleft", "download",
  "download-alt", "downright", "draft", "dreamweaver", "dribbble", "dropmenu",
  "drupal", "drwho", "edit", "editalt", "egg", "eightball", "eject", "elipse",
  "emailalt", "emailexport", "emailforward", "emailforwarders", "emailimport",
  "emailrefresh", "emailtrace", "emergency", "emptycart", "enter", "envelope",
  "equalizer", "equalizeralt", "equals", "eraser", "erroralt", "euro",
  "euroalt", "evernote", "exchange-currency", "exclamation-sign",
  "excludeshape", "exit", "explorerwindow", "exportfile", "exposure",
  "extinguisher", "eye-close", "eye-open", "eye-view", "eyedropper",
  "facebook", "facebookalt", "facetime-video", "factory", "fantastico", "faq",
  "fast-backward", "fast-forward", "fastdown", "fastleft", "fastright",
  "fastup", "favoritefile", "favoritefolder", "featheralt-write", "fedora",
  "fence", "file", "film", "filmstrip", "filter", "finder", "fire", "firefox",
  "firewall", "firewire", "firstaid", "fish", "fishbone", "flag", "flagalt",
  "flagtriangle", "flash", "flashlight", "flashplayer", "flaskfull", "flickr",
  "flower", "flowernew", "folder-close", "folder-open", "foldertree", "font",
  "foodtray", "football-soccer", "forbiddenalt", "forest-tree",
  "forestalt-treealt", "fork", "forklift", "form", "forrst", "fort", "forward",
  "fourohfour", "foursquare", "freeway", "fridge", "fries", "ftp",
  "ftpaccounts", "ftpsession", "fullscreen", "gameboy", "gamecursor",
  "gasstation", "gearfour", "ghost", "gift", "github", "glass", "glasses",
  "glassesalt", "globe", "globealt", "glue", "gmail", "golf", "googledrive",
  "googleplus", "googlewallet", "gpsoff-gps", "gpson", "gpu-graphicscard",
  "gradient", "grails", "greenlantern", "greenlightbulb", "grooveshark",
  "groups-friends", "guitar", "halflife", "halo", "hamburger", "hammer",
  "hand-down", "hand-left", "hand-right", "hand-up", "handcuffs", "handdrag",
  "handtwofingers", "hanger", "happy", "harrypotter", "hdd", "hdtv",
  "headphones", "headphonesalt", "heart", "heartempty-love", "hearts",
  "helicopter", "hexagon-polygon", "hockey", "home", "homealt", "hospital",
  "hotdog", "hotlinkprotection", "hourglassalt", "html", "htmlfive", "hydrant",
  "icecream", "icecreamalt", "illustrator", "imac", "images-gallery",
  "importcontacts", "importfile", "inbox", "inboxalt", "incomingcall",
  "indent-left", "indent-right", "indexmanager", "infinity", "info-sign",
  "infographic", "ink", "inkpen", "insertbarchart", "insertpicture",
  "insertpicturecenter", "insertpictureleft", "insertpictureright",
  "insertpiechart", "instagram", "install", "intel", "intersection",
  "intersectshape", "invert", "invoice", "ipcontrol", "iphone", "ipod",
  "ironman", "islam", "island", "italic", "jar", "jason", "java", "joomla",
  "joystickarcade", "joystickatari", "jquery", "jqueryui", "kerning", "key",
  "keyboard", "keyboardalt", "keyboarddelete", "kidney", "king", "knife",
  "knight", "knob", "lab-flask", "lamp", "lan", "language", "laptop", "lasso",
  "lastfm", "laugh", "law", "layers", "layersalt", "leaf", "leechprotect",
  "legacyfilemanager", "lego", "lifeempty", "lifefull", "lifehacker",
  "lifehalf", "lifepreserver", "lightbulb-idea", "lighthouse", "lightning",
  "lightningalt", "line", "lineheight", "link", "linkalt", "linkedin", "linux",
  "list", "list-alt", "liver", "loading-hourglass", "loadingalt", "lock",
  "lockalt-keyhole", "lollypop", "lungs", "macpro", "macro-plant", "magazine",
  "magento", "magnet", "mailbox", "mailinglists", "man-male", "managedhosting",
  "map", "map-marker", "marker", "marvin", "mastercard", "maximize", "medal",
  "medalbronze", "medalgold", "medalsilver", "mediarepeat", "men", "menu",
  "merge", "mergecells", "mergeshapes", "metro-subway", "metronome",
  "mickeymouse", "microphone", "microscope", "microsd", "microwave",
  "mimetype", "minimize", "minus", "minus-sign", "missedcall", "mobile",
  "moleskine", "money-cash", "moneybag", "monitor", "monstersinc",
  "moon-night", "mouse", "mousealt", "move", "movieclapper", "moviereel",
  "muffin", "mug", "mushroom", "music", "musicalt", "mutealt", "mxentry",
  "mybb", "myspace", "mysql-dolphin", "nail", "navigation", "network",
  "networksignal", "news", "newtab", "newwindow", "next", "nexus",
  "nintendods", "nodejs", "notes", "notificationbottom", "notificationtop",
  "nut", "off", "office-building", "officechair", "ok", "ok-circle", "ok-sign",
  "oneup", "oneupalt", "opencart", "opennewwindow", "orange", "outbox",
  "outgoingcall", "oxwall", "pacman", "pageback", "pagebreak", "pageforward",
  "pagesetup", "paintbrush", "paintroll", "palette-painting", "paperclip",
  "paperclipalt", "paperclipvertical", "paperplane", "parentheses",
  "parkeddomain", "password", "passwordalt", "pasta", "patch", "path", "pause",
  "paw-pet", "pawn", "paypal", "peace", "pen", "pencil", "pepperoni",
  "percent", "perl-camel", "perlalt", "phone-call", "phonealt", "phonebook",
  "phonebookalt", "phonemic", "phoneold", "photoshop", "php", "phpbb",
  "phppear", "piano", "picture", "pictureframe", "piggybank", "pigpena",
  "pigpenb", "pigpenc", "pigpend", "pigpene", "pigpenf", "pigpeng", "pigpenh",
  "pigpeni", "pigpenj", "pigpenk", "pigpenl", "pigpenm", "pigpenn", "pigpeno",
  "pigpenp", "pigpenq", "pigpenr", "pigpens", "pigpent", "pigpenu", "pigpenv",
  "pigpenw", "pigpenx", "pigpeny", "pigpenz", "pilcrow", "pill-antivirusalt",
  "pin", "pipe", "piwigo", "pizza", "placeadd", "placealt", "placealtadd",
  "placealtdelete", "placedelete", "placeios", "plane", "plaque", "play",
  "play-circle", "playstore", "playvideo", "plug", "pluginalt", "plus",
  "plus-sign", "pocket", "podcast", "podium-winner", "pokemon", "police",
  "polygonlasso", "post", "postalt", "pound", "poundalt", "powerjack",
  "powerplug", "powerplugeu", "powerplugus", "presentation", "prestashop",
  "pretzel", "preview", "previous", "print", "protecteddirectory", "pscircle",
  "pscursor", "psdown", "psleft", "pslone", "psltwo", "psright", "psrone",
  "psrtwo", "pssquare", "pstriangle", "psup", "psx", "pull", "punisher",
  "push", "puzzle-plugin", "python", "qrcode", "quake", "queen", "query",
  "question-sign", "quote", "quotedown", "quoteup", "raceflag", "racquet",
  "radio", "radioactive", "radiobutton", "railroad", "rain", "ram", "random",
  "rar", "raspberry", "raspberrypi", "rawaccesslogs", "razor", "reademail",
  "record", "rectangle", "recycle", "reddit", "redirect", "refresh",
  "reliability", "remote", "remove", "remove-circle", "remove-sign",
  "removefriend", "repeat", "repeatone", "resellerhosting", "residentevil",
  "resistor", "resize", "resize-full", "resize-horizontal", "resize-small",
  "resize-vertical", "restart", "restaurantmenu", "restore", "restricted",
  "retweet", "rim", "ring", "road", "roadsign-roadsignright", "roadsignleft",
  "robocop", "rocket-launch", "rook", "root", "rorschach", "rotateclockwise",
  "rotatecounterclockwise", "roundrectangle", "route", "router", "rss",
  "rubberstamp", "ruby", "ruler", "sad", "safetypin", "satellite",
  "satellitedish-remotemysql", "save-floppy", "scales", "science-atom",
  "scope-scan", "scopealt", "screenshot", "screw", "screwdriver",
  "screwdriveralt", "script", "sd", "search", "searchdocument", "searchfolder",
  "security-shield", "securityalt-shieldalt", "selection-rectangleselection",
  "selectionadd", "selectionintersect", "selectionremove", "seo", "server",
  "servers", "settingsandroid", "settingsfour-gearsalt", "settingsthree-gears",
  "settingstwo-gearalt", "shades-sunglasses", "shapes", "share", "share-alt",
  "sharealt", "sharedfile", "sharedhosting", "sharethree", "sheriff",
  "shipping", "shopping", "shopping-cart", "shoppingbag", "shortcut", "shovel",
  "shredder", "shutdown", "sidebar", "signal", "sim", "simalt", "skrill",
  "skull", "skype", "skypeaway", "skypebusy", "skypeoffline", "skypeonline",
  "smaller", "smf", "smile", "snow", "snowman", "socialnetwork", "software",
  "sortbynameascending-atoz", "sortbynamedescending-ztoa",
  "sortbysizeascending", "sortbysizedescending", "soundwave", "soup",
  "spaceinvaders", "spades", "spam", "spamalt", "spawn", "speaker", "speed",
  "spider", "spiderman", "split", "spoon", "spray", "spreadsheet", "squareapp",
  "squarebrackets", "ssh", "sslmanager", "stadium", "stamp", "stampalt",
  "star", "star-empty", "starempty", "starfull", "starhalf", "steak", "steam",
  "step-backward", "step-forward", "sticker", "stiletto", "stockdown",
  "stocks", "stockup", "stomach", "stop", "stopwatch", "storage-box",
  "storagealt-drawer", "store", "storm", "stove", "strawberry",
  "strikethrough", "student-school", "stumbleupon", "subdomain", "submarine",
  "subscript", "subtractshape", "sum", "sun-day", "sunnysideup", "superman",
  "superscript", "support", "supportalt", "switch", "switchoff",
  "switchoffalt", "switchon", "switchonalt", "sword", "sync", "syncalt",
  "synckeeplocal", "synckeepserver", "syringe-antivirus", "tablet",
  "tabletennis-pingpong", "taco", "tag", "tagalt-pricealt", "tags",
  "tagvertical", "tank", "target", "taskmanager-logprograms", "tasks", "taxi",
  "tea", "teapot", "telescope", "temperature-thermometer",
  "temperaturealt-thermometeralt", "tennis", "tent-camping", "terminal",
  "tethering", "tetrisone", "tetristhree", "tetristwo", "text-height",
  "text-width", "th", "th-large", "th-list", "theather", "theme-style",
  "thissideup", "threecolumns", "thumbs-down", "thumbs-up", "ticket",
  "tictactoe", "tie-business", "time", "timeline", "tint", "toast",
  "toiletpaper", "tooth", "toothbrush", "tophat", "torigate", "touchpad",
  "trafficlight", "transform", "trash", "trashempty", "trashfull", "travel",
  "treediagram", "treeornament", "triangle", "tron", "trophy", "truck",
  "trumpet", "tumblr", "tv", "twitter", "twocolumnsleft", "twocolumnsleftalt",
  "twocolumnsright", "twocolumnsrightalt", "ubuntu", "umbrella", "underline",
  "undo", "unlock", "upleft", "upload", "uploadalt", "upright", "uptime",
  "usb", "usbalt", "usbplug", "user", "userfilter", "usfootball",
  "value-coins", "vector", "vendetta", "video", "viking", "vimeo", "vinyl",
  "violin", "virus", "visa", "visitor", "vlc-cone", "voice", "volume-down",
  "volume-off", "volume-up", "vps", "wacom", "walle", "wallet", "warcraft",
  "warmedal", "warning-sign", "washer", "watch", "watertap-plumbing",
  "wave-sea", "wavealt-seaalt", "webcam", "webcamalt", "webhostinghub",
  "webmail", "webpage", "webplatform", "websitealt", "websitebuilder",
  "weight", "westernunion", "wheel", "wheelchair", "whistle", "whmcs", "wifi",
  "wind", "windleft", "windows", "windright", "wine", "wizard", "wizardalt",
  "wizardhat", "woman-female", "women", "wordpress", "wrench", "wrenchalt",
  "xbox", "xmen", "yahoo", "yen", "yenalt", "yinyang", "youtube", "zelda",
  "zikula", "zip", "zodiac-aquarius", "zodiac-aries", "zodiac-cancer",
  "zodiac-capricorn", "zodiac-gemini", "zodiac-leo", "zodiac-libra",
  "zodiac-pisces", "zodiac-sagitarius", "zodiac-scorpio", "zodiac-taurus",
  "zodiac-virgo", "zoom-in", "zoom-out", "vk", "bitcoin", "rouble", "phpnuke",
  "modx", "eoneohseven", "subrion", "typothree", "tikiwiki", "pligg",
  "pyrocms", "mambo", "contao", "crackedegg", "coffeecupalt", "reademailalt",
  "train", "shoebox", "bathtub", "ninegag", "pebble", "musicthree", "stairsup",
  "stairsdown", "bookalt", "programclose", "programok", "splitalt",
  "solarsystem", "honeycomb", "tools", "xoops", "pixie", "dotclear",
  "impresscms", "saurus", "impresspages", "monstra", "snews", "jcore",
  "silverstripe", "btwoevolution", "nucleus", "symphony", "vanillacms",
  "bbpress", "phpbbalt", "chyrp", "pivotx", "pagecookery", "moviereelalt",
  "cassettealt", "photobucket", "technorati", "theverge", "stacks", "dotlist",
  "numberlist", "indentleft", "indentright", "fblike", "fbdislike", "sale",
  "sharetronix", "markerdown", "markerup", "markerleft", "markerright",
  "bookmarkalt", "calendarthree", "wineglass", "slidersoff", "slidersmiddle",
  "slidersfull", "slidersdesc", "slidersasc", "slideronefull", "slidertwofull",
  "sliderthreefull", "noborders", "bottomborder", "topborder", "leftborder",
  "rightborder", "horizontalborder", "verticalborder", "outerborders",
  "innerborders", "fullborders", "networksignalalt", "resizeverticalalt",
  "resizehorizontalalt", "moneyalt", "fontcase", "playstation", "cube",
  "sphere", "ceilinglight", "chandelier", "details", "detailsalt", "bullet",
  "gun", "processorthree", "world", "statistics", "shoppingcartalt",
  "microphonealt", "routeralt", "shell", "squareplay", "squarestop",
  "squarepause", "squarerecord", "squareforward", "squareback", "squarenext",
  "squareprevious", "mega", "charliechaplin", "popcorn", "fatarrowright",
  "fatarrowleft", "fatarrowdown", "fatarrowup", "shirtbutton",
  "shirtbuttonalt", "cuckooclock", "lens", "voltage", "planealt", "busalt",
  "lipstick", "plantalt", "paperboat", "texture", "dominoone", "dominotwo",
  "dominothree", "dominofour", "dominofive", "dominosix", "dominoseven",
  "dominoeight", "dominonine", "connected", "connectedpc", "musicsheet",
  "rdio", "spotify", "deviantart", "yelp", "behance", "nfc", "earbudsalt",
  "earbuds", "amazon", "openid", "digg", "retweet", "moonnew",
  "moonwaxingcrescent", "moonfirstquarter", "moonwaxinggibbous", "moonfull",
  "moonwaninggibbous", "moonthirdquarter", "moonwaningcrescent", "planet",
  "sodacup", "cocktail", "church", "mosque", "comedy", "tragedy", "bacon",
  "trailor", "tshirt", "design", "spiderweb", "fireplace", "tallglass",
  "grapes", "biohazard", "directions", "equalizerthree", "mountains", "bing",
  "windowseight", "microsoftoffice", "salealt", "purse", "chickenalt",
  "podium", "findfriends", "microphonethree", "workshirt", "donotdisturb",
  "addtags", "removetags", "carbattery", "debug", "trojan", "molecule",
  "safetygoggles", "leather", "teddybear", "stroller", "circleplay",
  "circlestop", "circlepause", "circlerecord", "circleforward",
  "circlebackward", "circlenext", "circleprevious", "circleplayempty",
  "circlestopempty", "circlepauseempty", "circlerecordempty",
  "circleforwardempty", "circlebackwardempty", "circlenextempty",
  "circlepreviousempty", "belt", "bait", "manalt", "womanalt", "clover",
  "pacifier", "calcplus", "calcminus", "calcmultiply", "calcdivide",
  "calcequals", "city", "hdvideo", "horizontalexpand", "horizontalcontract",
  "radar", "threed", "flickralt", "pattern", "elevator", "escalator",
  "portrait", "cigar", "dropbox", "origami", "opensource", "redaxscript",
  "mahara", "forkcms", "pimcore", "bigace", "aef", "punbb", "phorum", "fluxbb",
  "minibb", "zenphoto", "fourimages", "plogger", "jcow", "elgg", "etano",
  "openclassifieds", "osclass", "openx", "phplist", "roundcube", "pommo",
  "webinsta", "limesurvey", "fengoffice", "eyeos", "dotproject", "collabtive",
  "projectpier", "taskfreak", "eventum", "traq", "mantisbugtracker",
  "oscommerce", "zencart", "tomatocart", "boxbilling", "zurmo", "orangehrm",
  "vtiger", "mibew", "phpmyfaq", "yiiframework", "zendframework", "fuelphp",
  "kohana", "smarty", "sidu", "simplepie", "projectsend", "extjs", "raphael",
  "sizzle", "yui", "scissorsalt", "cuthere", "coinsalt", "parkingmeter",
  "treethree", "packarchive", "unpackarchive", "terminalalt", "jersey", "vial",
  "noteslist", "notestasks", "notesdate", "noteslocation", "noteslistalt",
  "notestasksalt", "notesdatealt", "noteslocationalt", "useralt", "adduseralt",
  "removeuseralt", "banuseralt", "banuser", "paintrollalt", "textcursor",
  "textfield", "precisecursor", "brokenlink", "bookmarkthree", "bookmarkfour",
  "warmedalalt", "thinking", "commentlove", "commentsmiley", "sharetwo",
  "emptystar", "halfstar", "fullstar", "forbidden", "indentleftalt",
  "indentrightalt", "modxalt", "apple", "greekcolumn", "walletalt",
  "dollarsquare", "poundsquare", "yensquare", "eurosquare", "bitcoinsquare",
  "roublesquare", "roublealt", "bitcoinalt", "gavel", "barchartasc",
  "barchartdesc", "house", "garage", "milk", "hryvnia", "hryvniasquare",
  "hryvniaalt", "beeralt", "trolleyfull", "trolleyload", "trolleyunload",
  "trolleyempty", "mootools", "mootoolstwo", "mootoolsthree", "mysqlthree",
  "mysqlalt", "pgsql", "mongodb", "neofourj", "nosql", "catface", "polaroid",
  "clouderror", "camcorder", "projector", "sdvideo", "fx", "gramophone",
  "speakeralt", "hddalt", "usbflash", "manillaenvelope", "stickynote",
  "stickynotealt", "torch", "flashlightalt", "campfire", "cctv", "drill",
  "lampalt", "flowerpot", "defragment", "panoramio", "panorama", "photosphere",
  "panoramaalt", "timer", "burstmode", "cameraflash", "autoflash", "noflash",
  "threetofour", "sixteentonine", "cat", "dog", "rabbit", "koala",
  "butterflyalt", "butterfly", "wwf", "poop", "poopalt", "kiwi", "kiwifruit",
  "lemon", "pear", "watermelon", "onion", "turnip", "eggplant", "avocado",
  "perfume", "arch", "pluspages", "community", "pluscircles", "googleplusold",
  "plusgames", "event", "miui", "hot", "flowup", "flowdown", "moustache",
  "angle", "sleep", "acorn", "steamalt", "resizeupleft", "resizeupright",
  "resizedownright", "resizedownleft", "hammeralt", "bamboo", "mypictures",
  "mymusic", "myvideos", "systemfolder", "bookthree", "compile", "report",
  "fliphorizontal", "flipvertical", "construction", "counteralt", "counter",
  "papercutter", "snaptodot", "snaptogrid", "caligraphy", "icecreamthree",
  "skitch", "archlinux", "elementaryos", "loadingone", "loadingtwo",
  "loadingthree", "loadingfour", "loadingfive", "loadingsix", "loadingseven",
  "loadingeight", "brokenheart", "heartarrow", "heartsparkle", "cell", "panda",
  "refreshalt", "mirror", "headphonesthree", "fan", "tornado", "hangout",
  "beaker", "beakeralt", "phonescreensize", "tabletscreensize", "notification",
  "googleglass", "pinterest", "soundcloud", "alarmclock", "addalarm",
  "deletealarm", "turnoffalarm", "snooze", "bringforward", "sendbackward",
  "bringtofront", "sendtoback", "tectile", "grave", "gravetwo", "gravethree",
  "gravefour", "textlayer", "vectoralt", "drmanhattan", "foursquarealt",
  "hashtag", "enteralt", "exitalt", "cartalt", "vaultthree", "fatundo",
  "fatredo", "feedly", "feedlyalt", "squareheart", "squarestar",
  "squarecomment", "squarelike", "squarebookmark", "squaresearch",
  "squaresettings", "squarevoice", "google", "emojigrinalt", "emojigrin",
  "constellation", "emojisurprise", "emojidead", "emojiangry", "emojidevil",
  "emojiwink", "moonorbit", "emojismile", "emojisorry", "emojiconfused",
  "emojisleep", "emojicry", "circlefork", "circlespoon", "circleknife",
  "circlepencil", "circlehammer", "circlescrewdriver", "middlefinger",
  "heavymetal", "turnright", "turnleft", "vineapp", "vineappalt", "finance",
  "survey", "hangouts", "square0", "square1", "square2", "square3", "square4",
  "square5", "square6", "square7", "square8", "square9", "squarea", "squareb",
  "squarec", "squared", "squaree", "squaref", "squareg", "squareh", "squarei",
  "squarej", "squarek", "squarel", "squarem", "squaren", "squareo", "squarep",
  "squareq", "squarer", "squares", "squaret", "squareu", "squarev", "squarew",
  "squarex", "squarey", "squarez", "shuttle", "meteor", "galaxy",
  "observatory", "astronaut", "asteroid", "sunrise", "sunset", "tiderise",
  "tidefall", "mushroomcloud", "galaxyalt", "sputnik", "sextant", "spock",
  "meteorite", "deathstar", "deathstarbulding", "fallingstar", "windmill",
  "windmillalt", "pumpjack", "nuclearplant", "solarpanel", "barrel",
  "canister", "railtunnel", "roadtunnel", "pickaxe", "cow", "sheep",
  "fountain", "circlezero", "circleone", "circletwo", "circlethree",
  "circlefour", "circlefive", "circlesix", "circleseven", "circleeight",
  "circlenine", "circlea", "circleb", "circlec", "circled", "circlee",
  "circlef", "circleg", "circleh", "circlei", "circlej", "circlek", "circlel",
  "circlem", "circlen", "circleo", "circlep", "circleq", "circler", "circles",
  "circlet", "circleu", "circlev", "circlew", "circlex", "circley", "circlez",
  "creeper", "minecraft", "minecraftalt", "pixelsword", "pixelbroadsword",
  "pixelwand", "pixelpotion", "pixelpotionalt", "pixelpickaxe", "pixelbow",
  "pixelarrow", "pixelaxe", "pixeldagger", "pixelbastardsword", "pixellance",
  "pixelbattleaxe", "pixelshovel", "pixelsphere", "pixelelixir", "pixelchest",
  "pixelshield", "pixelheart", "rudder", "folderalt", "removefolderalt",
  "addfolderalt", "deletefolderalt", "openfolderalt", "clipboardalt",
  "pastealt", "loadingflowccw", "loadingflowcw", "code", "cloveralt", "lips",
  "kiss", "manualshift", "simcardthree", "parthenon", "addcomment",
  "deletecomment", "gender", "callalt", "outgoingcallalt", "incomingcallalt",
  "missedcallalt", "export", "import", "cherryalt", "panties", "kimai",
  "livejournal", "livejournalalt", "tagged", "temple", "mayanpyramid",
  "egyptpyramid", "tampermonkey", "pushbullet", "currents", "communitysmall",
  "squaregithub", "projectfork", "projectmerge", "projectcompare", "history",
  "notebook", "issue", "issueclosed", "issuereopened", "rubyalt", "lighton",
  "lightoff", "bellalt", "versions", "twog", "threeg", "fourg", "gpsalt",
  "circleloaderfull", "circleloaderseven", "circleloadersix",
  "circleloaderfive", "circleloaderfour", "circleloaderthree",
  "circleloadertwo", "circleloaderone", "circleloaderempty", "whatsapp",
  "whatsappalt", "viber", "squareviber", "teamviewer", "tunein", "tuneinalt",
  "weightscale", "boxing", "speedalt", "scriptalt", "splitthree", "mergethree",
  "layersthree", "mutemic", "zerply", "circlegoogleplus", "circletwitter",
  "circlefacebook", "circleyahoo", "circlegithub", "forumsalt", "circlepath",
  "circlevimeo", "circlevine", "instagramtwo", "instagramthree", "flickrthree",
  "quora", "squarequora", "circlequora", "picasa", "branch", "ingress",
  "squarezerply", "circlezerply", "squarevimeo", "squaretwitter",
  "brightnessalt", "brightnessalthalf", "brightnessaltfull",
  "brightnessaltauto", "shirtbuttonthree", "openshare", "copyapp", "bowl",
  "cloudalt", "cloudaltdownload", "cloudaltupload", "cloudaltsync",
  "cloudaltprivate", "flipboard", "octoloaderempty", "octoloaderone",
  "octoloadertwo", "octoloaderthree", "octoloaderfour", "octoloaderfive",
  "octoloadersix", "octoloaderseven", "octoloaderfull", "selectionsymbol",
  "infinityalt", "pullrequest", "projectforkdelete", "projectforkprivate",
  "commit", "htmlfile", "pushalt", "pullalt", "photonineframes", "wetfloor",
  "instagramfour", "circleinstagram", "videocamerathree", "subtitles",
  "subtitlesoff", "compress", "baby", "ducky", "handswipe", "swipeup",
  "swipedown", "twofingerswipedown", "twofingerswipeup", "doubletap",
  "dribbblealt", "circlecallmissed", "circlecallincoming",
  "circlecalloutgoing", "circledownload", "circleupload", "minismile",
  "minisad", "minilaugh", "minigrin", "miniangry", "minitongue",
  "minitonguealt", "miniwink", "minitonguewink", "miniconfused", "soundright",
  "soundleft", "savetodrive", "layerorderup", "layerorderdown", "layerorder",
  "circledribbble", "squaredribbble", "handexpand", "handpinch", "fontserif",
  "fontsansserif", "fontrounded", "fonthandwriting", "fonttypewriter",
  "fontcomic", "fontcaligraphy", "fontgothic", "fontstencil",
];

var ICON_GROUPS = _.groupBy(ICONS, function(icon, index) {
  return index % 50;
});

var SLOGANS = [
  "Eting your children since february",
  "Establishing hippy communes since 2014",
  "where James vs. John was decided",
  "totally not being sarcastic about enslvaving the children",
  "where great minds -- HHHnnnnnnggghhhh -- ",
  "home of the serial shitter",
  "HULK SMASH!",
  "a less degenerate 4chan",
  "JAMES JAMES JAMES JAMES hulk JAMES JAMES JAMES JAMES",
  "When you stare into the anon, the anon also stares into you",
  "where poop and colors combine to make magic",
  "where it is foretold that one day an anon shall achieve quadruple black and transcend humankind to take their place by JAMES's side",
  "Let us touch your poop",
  "Totally not racist toward the Japs",
  "where colors set you free and then -- oh hold on -- hnnnnnNnnNNÑÑÑÑGH",
  "Home of the incontinent",
  "taste the rainbow FUCK YOU SKITTLES",
  "many voices, one anon",
  "destroying battery power since 2014",
  "questioning purple since 2014",
  "no you don't fucking love science",
  "where you don't look crazy having conversations with yourself",
  "where colors go to die",
  "redefining purple",
  "spoiler alert",
  "50 or the void",
  "sloganeering our way to a brighter future",
  "where well adjusted people go to anon",
  "if i lose my privilege, what will i have left?"
];





module.exports = {
  routes: {
    "" : "index",
    "rules" : "rules",
    "anon" : "colors",
    "faq" : "faq",
    "archives" : "archives",
    "guide" : "about",
    "icons" : "icons",
    "robots.txt" : "robots"
  },

  about: function(ctx, api) {
    this.set_fullscreen(true);
    this.set_title("atob archives");

    var slogan = SLOGANS[_.random(SLOGANS.length)];

    // bring the slogans in over here
    var template_str = api.template.render("controllers/about.html.erb", {
      slogan: slogan

    });


    api.page.render({ content: template_str, socket: false});



  },

  archives: function(ctx, api) {
    this.set_fullscreen(true);
    this.set_title("atob archives");

    var render_boards = api.page.async(function(flush) {
      Board.findAll({
          order: "name ASC"
        })
        .success(function(results) {
          var boards = _.map(results, function(r) { 
            return r.getDataValue('name'); 
          });

          var template_str = api.template.partial("home/board_links.html.erb", {
            boards: boards 
          });

          flush(template_str);

        });
    });

    var render_recent_archives = api.page.async(function(flush) {
      var summarize = require_app("client/summarize");
      ArchivedPost.findAll({
        where: {
          thread_id: null,
          parent_id: null
        },
        order: "id DESC"
      }).success(function(posts) {
        posts = _.unique(posts, function(p) { return p.id; } );
        var template_str = api.template.partial("home/recent_posts.html.erb", {
          posts: posts,
          summarize: summarize,
          archive: "a"
        });

        api.bridge.controller("home", "format_text");
        flush(template_str);
      });


    });

    var template_str = api.template.render("controllers/archives.html.erb", {
      render_boards: render_boards,
      render_archives: render_recent_archives
    });

    api.bridge.controller("home", "init_tripcodes");

    api.page.render({ content: template_str, socket: false});

  },

  index: function(ctx, api) {
    this.set_fullscreen(true);
    this.set_title("atob");

    var summarize = require_app("client/summarize");

    var render_recent_posts = api.page.async(function(flush) {
      Post.findAll({
        where: {
          board_id: ["a", "b"],
          parent_id: {
            ne: null
          }
        },
        order: "id DESC",
        limit: 5
      }).success(function(posts) {
        var template_str = api.template.partial("home/recent_posts.html.erb", {
          posts: posts,
          summarize: summarize
        });
        api.bridge.controller("home", "show_recent_posts");
        flush(template_str);
      });
    });

    var render_recent_threads = api.page.async(function(flush) {
      Post.findAll({
        where: {
          board_id: ["a", "b"],
          thread_id: null
        },
        order: "id DESC",
        limit: 3
      }).success(function(posts) {
        var template_str = api.template.partial("home/recent_posts.html.erb", {
          posts: posts,
          summarize: summarize
        });

        api.bridge.controller("home", "show_recent_threads");
        flush(template_str);
      });
    });

    var render_anons = function() {
      var counts = {};
      var load_controller = require_core("server/controller").load;
      var boards_controller = load_controller("boards");
      _.each(boards_controller.GOING_ONS, function(anons) {
        _.each(anons, function(emote, id) {
          counts[id] = emote;
        });
      });

      var lookup = {
        t: "icon-keyboardalt",
        f: "icon-glassesalt",
        u: "icon-glassesalt"
      };

      var str = _.map(_.values(counts), function(c) {
        return "<i class='" + (lookup[c[0]] || "icon-" + c.replace(/:/g, "")) + "' />";
      });

      return str.join(" ");
    };

    var render_boards = api.page.async(function(flush) {
      Board.findAll({
          order: "name ASC"
        })
        .success(function(results) {
          var boards = _.map(results, function(r) { 
            return r.getDataValue('name'); 
          });

          var template_str = api.template.partial("home/board_links.html.erb", {
            boards: boards 
          });

          flush(template_str);

        });
    });

    var template_str = api.template.render("controllers/home.html.erb", {
      render_boards: render_boards,
      render_anons: render_anons,
      render_recent_posts: render_recent_posts,
      render_recent_threads: render_recent_threads,
      slogan: SLOGANS[_.random(SLOGANS.length)]
    });

    api.page.render({ content: template_str, socket: true});
  },
  rules: function(ctx, api) {
    this.set_fullscreen(true);
    var template_str = api.template.partial("home/rules.html.erb", {} );

    api.page.render({ content: template_str});

  },
  icons: function(ctx, api) {
    var render_icons = function() {
      var icon_list = $("<div />");
      _.each(ICON_GROUPS, function(icons) {
        var async_work = api.page.async(function(flush) {
          var iconsEl = $("<div class='clearfix' />");
          _.each(icons, function(icon) {
            var divEl = $("<div class='col-sm-3' />");
            var iconEl = $("<i class='mrl' />");
            iconEl.addClass("icon-" + icon);
            divEl.append(iconEl);
            iconsEl.append(divEl);
            divEl.append(icon);
          });

          flush(iconsEl.html());
        });


        var async_pl = async_work();
        icon_list.append(async_pl);
      });

      return icon_list.html();

    };

    var template_str = api.template.partial("home/icons.html.erb", { 
      render_icons: render_icons
    });

    api.page.render({ content: template_str});

  },
  faq: function(ctx, api) {
    var template_str = api.template.partial("home/faq.html.erb", { });

    api.page.render({ content: template_str});

  },
  colors: function(ctx, api) {
    var hashes = [];
    this.set_fullscreen(true);
    Post.findAll({ 
      group: ["tripcode", "author"],
      order: "count DESC",
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('*')), 'count'],
        "tripcode",
        "author"
        ],
      }).success(function(groups) {
        var count = 0;
        _.each(groups, function(group) {
          if (group.dataValues.count > 1) {
            hashes.push(group.dataValues);
            count += 1;
          }

        });

        var content = $("<div class='container mtl' />");
        _.each(hashes, function(hash) {
          var hashEl = $("<div class='col-xs-4 col-md-2 tripcode'>");
          hashEl.attr("data-tripcode", hash.tripcode);
          var opacity = Math.max(parseFloat(hash.count * 20) / count);
          hashEl.css("opacity", opacity);
          content.append(hashEl);
        });

        api.bridge.controller("home", "gen_tripcodes");
        api.page.render({content: content.toString() });


      });
  },
  robots: function(ctx) {
    ctx.res.end("User-agent: *\nDisallow: /");
  },

  socket: function(s) { 
    var load_controller = require_core("server/controller").load;
    var boards_controller = load_controller("boards");
    boards_controller.lurk(s); 
  }
};
