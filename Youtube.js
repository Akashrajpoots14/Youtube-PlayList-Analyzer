const { get } = require('http');
const puppeteer = require('puppeteer');
const pdf = require('pdfkit');
const fs = require('fs');
let link = 'https://www.youtube.com/playlist?list=PL9bw4S5ePsEEqCMJSiYZ-KTtEjzVy0YvK'
let cTab
(async function(){
    try{
        let browserOpen = puppeteer.launch({
            headless : false,
            defaultViewport : null,
            args : ['--start-maximized']
        })

        let browserInstance = await browserOpen
        let allTabsArr = await browserInstance.pages()
        cTab = allTabsArr[0];
        await cTab.goto(link);
        await cTab.waitForSelector('h1#title')
        let name = await cTab.evaluate(function(select){return document.querySelector(select).innerText},'h1#title');
       

        let allData = await cTab.evaluate(getData, '#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer');
      
        let TotalVideos = allData.noOfVideos.split(" ")[0];
        
        let currentVideos = await getCurrVideosLength();
        console.log(currentVideos);
        while(TotalVideos*10-currentVideos >= 20){
            await scrollToBottom()
            currentVideos = await getCurrVideosLength()
        }
        let finalList = await getStats()
        let pdfDoc = new pdf
        pdfDoc.pipe(fs.createWriteStream('play.pdf'))
        pdfDoc.text(JSON.stringify(finalList))
        pdfDoc.end()

        
    }catch(error){

    }
})()

function getData(selector) {
    let allElems = document.querySelectorAll(selector)
    let noOfVideos = allElems[0].innerText;
    let noOfViews = allElems[1].innerText;

    return{
        noOfVideos,
        noOfViews
    }
}

async function getCurrVideosLength(){
    let length = await cTab.evaluate(getLength,'#container #thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer' )
    return length;
}

function getLength(durationSelect){
    let durationElems = document.querySelectorAll(durationSelect)
    return durationElems.length;
}

async function scrollToBottom(){
    await cTab.evaluate(gotoBottom)
    function gotoBottom(){
        window.scrollBy(0,window.innerHeight)
    }
}


async function getStats() {
    let list = cTab.evaluate(getNameAndDuration,'#video-title', '#container #thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer' )
    return list
}


function getNameAndDuration(videoSelector, durationSelector) {
    let videoElems = document.querySelectorAll(videoSelector)
    let durationElems = document.querySelectorAll(durationSelector)


    let currentList = []

    for(let i =0 ;i<durationElems.length;i++){
        let videoTitle = videoElems[i].innerText
        let duration = durationElems[i].innerText
        currentList.push({videoTitle,duration})
    }
    return currentList;
}