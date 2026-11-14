// By no means is this good code but whatever
var root = document.getElementById("datastuff")
const intro = document.getElementById("intro");
const toc = document.getElementById("toc");
const searchbar = document.getElementById("searchbar");
const searchbaritem = document.getElementById("searchbar2");

var levelTerms = [];
var itemTerms = [];

searchbar.onchange = function() {
    m.redraw();
}
searchbaritem.onchange = function() {
    m.redraw();
}

var jsonresult;
try {
    const request = new XMLHttpRequest();
    request.open("GET", "wkpictures/output.json", false);
    request.send(null);
    jsonresult = JSON.parse(request.responseText);
} catch(error) {
    console.log(error)
    m.render(intro,m("div", {class: "errorbox"},"Loading failed:\n"+error));
}

function MakeItemData(item) {
    var chance = item.spawnchance ? item.spawnchance+"%" : "100%"
    return [
        m("div", {class: "itemName"}, item.name, m("small", ` (#${item.num})`)),
        m("ul", {class: "itemDataSummary"}, [ //
            m("h3", "Unadjusted chance: ", [m("b", chance), item.spawnchance == null ? m("i", " (probably)") : null]),
            m("p", {style: "font-weight: normal"}, "Details:"),
            item.textdata.map(function(dat) {
                return m("li", {key: dat}, dat)}
            )
        ])
    ]
}
function ItemImageClicked(event) { //this is stupid i know but this is really just a fancy json and picture site thing
    var isFullbright = event.srcElement.src.includes("-fullbright")
    event.srcElement.parentElement.className = isFullbright ? "itemPictureContainer normal" : "itemPictureContainer fullbright"
    event.srcElement.src = isFullbright ? event.srcElement.src.replace("-fullbright", "") : event.srcElement.src.replace(".jpg", "-fullbright.jpg")
}
function SideviewButtonClicked(event) {
    var isvariantA = event.srcElement.className.includes("firstVariant")
    event.srcElement.className = isvariantA ? event.srcElement.className.replace("firstVariant", "lastVariant") : event.srcElement.className.replace("lastVariant", "firstVariant")
    event.srcElement.src = isvariantA ? event.srcElement.src.replace("-sideview1", "-sideview2") : event.srcElement.src.replace("-sideview2", "-sideview1")
}
function CollapsibleClicked(event) {
    event.srcElement.parentElement.classList.toggle("active");
    var content = event.srcElement.parentElement.nextElementSibling;
      if (content.style.maxHeight){
    content.style.maxHeight = null;
    } else {
       content.style.maxHeight = content.scrollHeight + "px";
    }
}

function ArrIncludes(array, string) {
    for(let i = 0; i < array.length; i++) {
        if(string.includes(array[i])) {
            return true
        }
    }
    return false;
}

m.render(intro, [m("p", ["White Knuckle item spawns for version ", m("b", m("i",jsonresult.version)), ". Items may be out of bounds or otherwise invisible. No guarantees. Might contain bad data, still in progress. Does not contain/account for other forms of item spawns. Also, a machine doesnt really know how to make a good screenshot but whatever."])])
var ToCComponent = {
    view: function() {
        try {
            var tocContents = [];
            
            if(searchbar.value) {          
                levelTerms = searchbar.value.split(",")
                levelTerms = levelTerms.map(str => str.trim().toLowerCase())
            } else levelTerms = [];
            if(searchbaritem.value) {
                itemTerms = searchbaritem.value.split(",")
                itemTerms = itemTerms.map(str => str.trim().toLowerCase())
            } else itemTerms = [];
            console.log(levelTerms,itemTerms,"first");
            for (let levelIndex = jsonresult.levels.length-1; levelIndex >= 0; levelIndex--) {
                const level = jsonresult.levels[levelIndex];
                if(levelTerms.length > 0 && !ArrIncludes(levelTerms,level.levelName.toLowerCase())) {continue;}
                if(itemTerms.length > 0) {
                    var containsItem = false;
                    for (let itemIndex = 0; itemIndex < level.items.length; ++itemIndex) {
                        const item = level.items[itemIndex];
                        if(!ArrIncludes(itemTerms,item.name.toLowerCase())) {continue;}
                        containsItem = true;
                    }
                    if(!containsItem) {continue;}
                }
                tocContents.push(m("li", m("a", {href: '#' + level.levelName}, level.levelName)))
            }
            return m("ul", tocContents);
        } catch(error) {
            console.log(error)
            return m("div", {class: "errorbox"},error);
        }
    }
}
m.mount(toc, ToCComponent);
var LevelListComp = {
    view: function() {
        try{
            var output = []
            console.log(levelTerms,itemTerms,"second");
            for (let levelIndex = 0; levelIndex < jsonresult.levels.length; ++levelIndex) {
                const level = jsonresult.levels[levelIndex];
                const levelName = ""+level.levelName;
                if(levelTerms.length > 0 && !ArrIncludes(levelTerms,levelName.toLowerCase())) {continue;}
                function doHeading() {
                    output.push(m("h1", {id: levelName}, levelName));    
                    output.push(m("div", [m("button", {class: "collapsible", onclick: CollapsibleClicked}, m("span", "Show/hide level sideview... (experimental)")), m("div", {class: "sideviewImage"}, m("img", {class: "firstVariant", src: `wkpictures/${level.levelSideviews[0]}.png`, loading: "lazy", onclick: SideviewButtonClicked}))]));
                }
                var levelResult = [];
                for (let itemIndex = 0; itemIndex < level.items.length; ++itemIndex) {
                    const item = level.items[itemIndex];
                    if(itemTerms.length > 0 && !ArrIncludes(itemTerms,item.name.toLowerCase())) {continue;}
                    levelResult.push(m("tr", [
                        m("td", [m("div", {class: "itemData"}, MakeItemData(item))]),
                        m("td", {class: "itemPictureContainer normal"}, [m("img", {class: "itemPicture", src: `wkpictures/${item.id}.jpg`, loading: "lazy", onclick: ItemImageClicked})]),
                    ]))
                }
                if(levelResult.length <= 0) {
                    if(!searchbaritem.value) {
                        doHeading()
                        output.push(m("p", {class: "noitemstext"}, "No items found in this level..."));
                    }
                    continue;
                }
                doHeading()
                output.push(m("div", {class: "tablecontainer"}, m("table", {cellspacing: "1"}, levelResult)));
            }
            
            return m("div", output);
        } catch(error) {
            console.log(error)
            return m("div", {class: "errorbox"},error);
        }
    }
}
m.mount(root, LevelListComp);