// ==UserScript==
// @name         你B抽奖
// @namespace
// @version      1.1
// @description  抽个奖而已，为啥一定要电磁力呢
// @author       Cait
// @match        https://t.bilibili.com/*
// @grant        none
// @updateURL         https://github.com/scx110a/bilibiliLuckyDraw/raw/master/bilibiliLuckyDraw.user.js
// @downloadURL       https://github.com/scx110a/bilibiliLuckyDraw/raw/master/bilibiliLuckyDraw.user.js
// ==/UserScript==

(function () {
    'use strict';
    if (window.location !== window.parent.location) { return; }
    var tid = window.location.href.toString().split("//")[1].split("/")[1].split("?")[0].split("#")[0];
    if (Number(tid) <= 0) { return; }
    var api_url = "https://api.vc.bilibili.com/dynamic_repost/v1/dynamic_repost/repost_detail"
    var relation_api = "https://api.bilibili.com/x/space/acc/relation?jsonp=jsonp&mid="
    var activity_api = "https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/space_history?visitor_uid=165885&offset_dynamic_id=0&need_top=1&host_uid="
    var userList = [], uidList = [], lastUserList = [], lastUidList = [], isFans = [], isTrash = [], lastIsFans = [];
    var trashUser = [];
    var totalCount = 0;
    var csvString = "UID,用户,是否粉丝";
    var drawPanel, listDiv, redrawLink, devilDrawAction, devilDrawNum, devildrawLink, randomKillLink, syncFollow, infoPanel, infoText;
    var tData = { userList: [], uidList: [], isFans: [] };
    var downloadUrl=null;
    var dirtyUidList = [];
    var storageData = { global: { ver: 1 } };
    if (tid !== "") {
        setTimeout(addDrawLink, 5000);
    }
    function addDrawLink() {
        var floatdiv = document.createElement("div");
        floatdiv.style = "z-index: 9999; position: fixed ! important; left: 50px; bottom: 50px;"
        var drawLink = document.createElement("button");
        drawLink.style = "  background-color: #f25d8e; border-radius: 23px; color: white; width: 84px; height: 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px;"
        drawLink.onclick = function () { startDraw(); }
        drawLink.innerText = "抽奖准备";
        floatdiv.appendChild(drawLink);
        document.body.appendChild(floatdiv);
        drawPanel = document.createElement("div");
        drawPanel.style = "z-index: 9997; position: fixed ! important; margin:auto; left: 0; top: 0; right:0; bottom:0; height: 500px; width: 500px; overflow: auto; background-color: pink; padding: 20px 20px 20px 20px;"
        drawPanel.style.display = "none";
        document.body.appendChild(drawPanel);
        infoPanel = document.createElement("div");
        infoPanel.style = "z-index: 9998; position: fixed ! important; margin:auto; left: 0; top: 0; right:0; bottom:0; height: 100px; width: 300px; overflow: auto; background-color: yellow; padding: 20px 20px 20px 20px;"
        infoPanel.style.display = "none";
        document.body.appendChild(infoPanel);
        infoText = document.createElement("div");
        infoPanel.appendChild(infoText);
        listDiv = document.createElement("div");
        drawPanel.appendChild(listDiv);
        devilDrawAction = document.createElement("button");
        devilDrawAction.innerText = "响指一下";
        devilDrawAction.onclick = function () { devilDrawAct(); }
        devilDrawAction.style = "background-color: #f25d8e; border-radius: 23px; color: white; width: 84px; height: 32px; text-align: center; text-decoration: none; font-size: 16px;"
        devilDrawAction.style.display = "none";
        drawPanel.appendChild(devilDrawAction);
        randomKillLink = document.createElement("button");
        randomKillLink.innerText = "随机枪毙";
        randomKillLink.onclick = function () { killdraw(); }
        randomKillLink.style = "background-color: #f25d8e; border-radius: 23px; color: white; width: 84px; height: 32px; text-align: center; text-decoration: none; font-size: 16px;"
        randomKillLink.style.display = "none";
        drawPanel.appendChild(randomKillLink);
        var closePanel = document.createElement("button");
        closePanel.innerText = "关闭";
        closePanel.onclick = function () { listDiv.innerHTML="";drawPanel.style.display = "none"; devilDrawAction.style.display = "none"; randomKillLink.style.display = "none"; if(downloadUrl !== null){URL.revokeObjectURL(downloadUrl); downloadUrl=null;}}
        closePanel.style = "background-color: #f25d8e; border-radius: 23px; color: white; width: 84px; height: 32px; text-align: center; text-decoration: none; font-size: 16px;"
        drawPanel.appendChild(closePanel);
        redrawLink = document.createElement("button");
        redrawLink.style = "background-color: gray; border-radius: 23px; color: white; width: 84px; height: 32px; text-align: center; text-decoration: none; font-size: 16px;"
        redrawLink.onclick = function () { redraw(); }
        redrawLink.innerText = "快速抽奖";
        redrawLink.disabled = true;
        floatdiv.appendChild(redrawLink);
        devildrawLink = document.createElement("button");
        devildrawLink.style = "background-color: gray; border-radius: 23px; color: white; width: 84px; height: 32px; text-align: center; text-decoration: none; font-size: 16px;"
        devildrawLink.onclick = function () { devildraw(); }
        devildrawLink.innerText = "灭霸抽奖";
        devildrawLink.disabled = true;
        floatdiv.appendChild(devildrawLink);
        var loadSave = document.createElement("button");
        loadSave.style = "background-color: #f25d8e; border-radius: 23px; color: white; width: 84px; height: 32px; text-align: center; text-decoration: none; font-size: 16px;"
        loadSave.onclick = function () {
            var syncDataStorage = JSON.parse(localStorage.getItem("drawStorage"));
            if (syncDataStorage) {
                var syncData = syncDataStorage[tid];
                if (syncData) {
                    lastUserList = syncData.userList;
                    lastUidList = syncData.uidList;
                    lastIsFans = syncData.isFans;
                    redrawLink.disabled = false;
                    redrawLink.style.backgroundColor = "#f25d8e";
                    devildrawLink.disabled = false;
                    devildrawLink.style.backgroundColor = "#f25d8e";
                    syncFollow.disabled = false;
                    syncFollow.style.backgroundColor = "#f25d8e";
                    alert("加载完成。");
                } else {
                    alert("这个动态里没有找到存档。");
                }
            } else {
                alert("没有找到任何存档。");
            }
        }
        loadSave.innerText = "读取存档";
        floatdiv.appendChild(loadSave);
        var br = document.createElement("br");
        floatdiv.appendChild(br);
        var exportSave = document.createElement("button");
        exportSave.style = "  background-color: #f25d8e; border-radius: 23px; color: white; width: 84px; height: 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px;"
        exportSave.onclick = function () {
            if(downloadUrl !== null){URL.revokeObjectURL(downloadUrl);downloadUrl=null;}
            listDiv.innerHTML="";
            var save = localStorage.getItem("drawStorage");
            var blob = new Blob(["\ufeff"+save], { type: 'text/json;' });
            var link = document.createElement("a");
            downloadUrl = URL.createObjectURL(blob);
            link.setAttribute("target","_blank");
            link.setAttribute("href", downloadUrl);
            link.innerText = "保存存档（iOS请长按选择在新标签打开）";
            link.setAttribute("download", "save.json");
            listDiv.appendChild(link); drawPanel.style.display = "";
        }
        exportSave.innerText = "导出存档";
        floatdiv.appendChild(exportSave);
        var filePicker = document.createElement("input");
        filePicker.type = "file";
        filePicker.style.display = "none";
        filePicker.onchange = function (event) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var res = e.target.result;
                alert("预览：" + res);
                if (confirm("确定要载入存档？之前的存档会消失。")) {
                    var loadedData = JSON.parse(res);
                    var syncData = loadedData[tid];
                    localStorage.setItem("drawStorage", res);
                    lastUserList = syncData.userList;
                    lastUidList = syncData.uidList;
                    lastIsFans = syncData.isFans;
                    redrawLink.disabled = false;
                    redrawLink.style.backgroundColor = "#f25d8e";
                    devildrawLink.disabled = false;
                    devildrawLink.style.backgroundColor = "#f25d8e";
                    syncFollow.disabled = false;
                    syncFollow.style.backgroundColor = "#f25d8e";
                }
            };
            reader.readAsText(event.target.files[0]);
        }
        document.body.appendChild(filePicker);
        var importSave = document.createElement("button");
        importSave.style = "  background-color: #f25d8e; border-radius: 23px; color: white; width: 84px; height: 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px;"
        importSave.onclick = function () { filePicker.click(); }
        importSave.innerText = "导入存档";
        floatdiv.appendChild(importSave);
        var deleteSave = document.createElement("button");
        deleteSave.style = "  background-color: #f25d8e; border-radius: 23px; color: white; width: 84px; height: 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px;"
        deleteSave.onclick = function () { if (confirm("你真的真的确定吗？没有保存存档的话数据就永远没了哦。")) { localStorage.clear(); alert("删除完成"); } }
        deleteSave.innerText = "删除存档";
        floatdiv.appendChild(deleteSave);
        syncFollow = document.createElement("button");
        syncFollow.style = "  background-color: gray; border-radius: 23px; color: white; width: 84px; height: 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px;"
        syncFollow.onclick = function () {
            alert("同步会花费一定时间，同时会完成一次抽奖准备，请耐心等待。");
            infoText.innerText = "正在进行快速同步……页面位置：0";
            infoPanel.style.display = "";
            dirtyUidList = lastUidList.slice(0, lastUidList.length);
            syncFansQuick();
        }
        syncFollow.innerText = "同步粉丝";
        syncFollow.disabled = true;
        floatdiv.appendChild(syncFollow);
        var syncTrash = document.createElement("button");
        syncTrash.style = "  background-color: #f25d8e; border-radius: 23px; color: white; width: 84px; height: 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px;"
        syncTrash.onclick = function () {
            alert("同步会花费一定时间，请耐心等待。");
            infoText.innerText = "正在进行同步……当前位置：0";
            infoPanel.style.display = "";
            syncTrashUser();
        }
        syncTrash.innerText = "同步抽奖号";
        syncTrash.disabled = false;
        floatdiv.appendChild(syncTrash);
    }

    function syncFansQuick(offset) {
        var queryString = "dynamic_id=" + tid;
        if (offset) {
            queryString = queryString + "&offset=" + offset;
        }
        var finalUrl = api_url + "?" + queryString;
        var xhttp = new XMLHttpRequest();
        xhttp.responseType = "json";
        xhttp.withCredentials = true;
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                try {
                    var recv = xhttp.response;
                    var nextOffset = recv.data.offset;
                    var items = Array.from(recv.data.items);
                    items.forEach(element => {
                        var idx = lastUidList.indexOf(element.desc.uid);
                        if (idx == -1) {
                            if (element.display.relation) {
                                var fansTemp;
                                if (element.display.relation.is_followed == 1) {
                                    fansTemp = true;
                                } else {
                                    fansTemp = false;
                                }
                                lastUidList.push(element.desc.uid);
                                lastUserList.push(element.desc.user_profile.info.uname);
                                lastIsFans.push(fansTemp);
                            }
                        } else {
                            if (element.display.relation) {
                                var fansTemp;
                                if (element.display.relation.is_followed == 1) {
                                    fansTemp = true;
                                } else {
                                    fansTemp = false;
                                }
                                lastIsFans[idx] = fansTemp;
                                dirtyUidList.splice(dirtyUidList.indexOf(element.desc.uid), 1);
                            }
                        }
                    });
                    if (recv.data.has_more !== 1) {
                        infoText.innerText = "快速同步已完成。无法快速同步的列表长度：" + dirtyUidList.length;
                        if(dirtyUidList.length > 0){
                            syncFans(0);
                        }else {
                            infoPanel.style.display = "none";
                            alert("同步结束");
                            tData.uidList = lastUidList;
                            tData.userList = lastUserList;
                            tData.isFans = lastIsFans;
                            storageData[tid] = tData;
                            localStorage.setItem("drawStorage", JSON.stringify(storageData));
                        }
                    } else {
                        infoText.innerText = "正在进行快速同步……页面位置：" + nextOffset;
                        syncFansQuick(nextOffset);
                    }
                } catch (e) {
                    infoPanel.style.display = "none";
                    alert("不知为何发生了点错误……");
                    console.log(e);
                }
            } else if (xhttp.readyState == 4 && xhttp.status != 200) {
                infoPanel.style.display = "none";
                alert("不知为何发生了点错误……");
            }
        }
        xhttp.onerror = function (e) {
            infoPanel.style.display = "none";
            alert("不知为何发生了点错误……");
            console.log(e);
        };
        try {
            xhttp.open("GET", finalUrl, true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send();
        } catch (exception) {
            infoPanel.style.display = "none";
            alert("不知为何发生了点错误……");
            console.log(exception);
        }
    }

    function fetchUserActivity(index, regex, callback) {
        let uid = uidList[index];
        var xhttp = new XMLHttpRequest();
        xhttp.responseType = "json";
        xhttp.withCredentials = true;
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                try {
                    var cards = xhttp.response.data.cards;
                    let activityList = [];
                    let matchCount = 0;
                    cards.forEach(val => {
                        let levelOne = JSON.parse(val.card);
                        if(levelOne.origin){
                            let actitem = JSON.parse(levelOne.origin);
                            if(actitem && actitem.item && actitem.item.description){
                                let activityDetail = actitem.item.description;
                                if(regex && activityDetail.match(regex)){
                                    matchCount++;
                                }
                                activityList.push(activityDetail);
                            }
                        }
                    });
                    callback.call(this, index + 1, matchCount, activityList);
                } catch (e) {
                    infoPanel.style.display = "none";
                    alert("不知为何发生了点错误……");
                    console.log(e);
                }
            } else if (xhttp.readyState == 4 && xhttp.status != 200) {
                infoPanel.style.display = "none";
                alert("不知为何发生了点错误……");
            }
        }
        xhttp.onerror = function (e) {
            infoPanel.style.display = "none";
            alert("不知为何发生了点错误……");
            console.log(e);
        };
        try {
            xhttp.open("GET", activity_api + uid, true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send();
        } catch (exception) {
            infoPanel.style.display = "none";
            alert("不知为何发生了点错误……");
            console.log(exception);
        }
    }

    function syncTrashUser(fetchIndex, count) {
        if(!fetchIndex){
            fetchIndex = 0;
        }else {
            if(!count){
                count = 0;
            }
            isTrash[fetchIndex - 1] = count;
             if(count > 6) trashUser.push(userList[fetchIndex - 1]);
        }
        if(fetchIndex >= uidList.length){
            infoText.innerText = "同步结束";
            setTimeout(function(){infoPanel.style.display = "none";}, 3000);
            if(trashUser.length > 0){
                alert("以下用户将会在抽奖号过滤中被过滤：" + trashUser.join(","));
            }
            //console.log(userList, isTrash);
            //console.log(trashUser);
            return;
        }
        infoText.innerText = "正在进行同步……当前位置：" + fetchIndex;
        fetchUserActivity(fetchIndex, /抽奖/, syncTrashUser);
    }

    function syncFans(index) {
        var rIndex = lastUidList.indexOf(dirtyUidList[index]);
        var xhttp = new XMLHttpRequest();
        xhttp.responseType = "json";
        xhttp.withCredentials = true;
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                try {
                    var recv = xhttp.response;
                    if (recv.data.be_relation.attribute >= 2) {
                        lastIsFans[rIndex] = true;
                    } else {
                        lastIsFans[rIndex] = false;
                    }
                    infoText.innerText = "正在同步慢速列表第" + (index + 1) + "项，总计" + dirtyUidList.length + "项。当前UID:" + lastUidList[rIndex] + "，服务器返回结果:" + lastIsFans[rIndex];
                    if (index + 1 < dirtyUidList.length) {
                        syncFans(index + 1);
                    } else {
                        infoText.innerText = "同步结束";
                        setTimeout(function(){infoPanel.style.display = "none";}, 3000);
                        tData.uidList = lastUidList;
                        tData.userList = lastUserList;
                        tData.isFans = lastIsFans;
                        storageData[tid] = tData;
                        localStorage.setItem("drawStorage", JSON.stringify(storageData));
                    }
                } catch (e) {
                    infoPanel.style.display = "none";
                    alert("不知为何发生了点错误……");
                    console.log(e);
                }
            } else if (xhttp.readyState == 4 && xhttp.status != 200) {
                infoPanel.style.display = "none";
                alert("不知为何发生了点错误……");
            }
        }
        xhttp.onerror = function (e) {
            infoPanel.style.display = "none";
            alert("不知为何发生了点错误……");
            console.log(e);
        };
        try {
            xhttp.open("GET", relation_api + lastUidList[rIndex], true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send();
        } catch (exception) {
            infoPanel.style.display = "none";
            alert("不知为何发生了点错误……");
            console.log(exception);
        }
    }

    function redraw() {
        userList = lastUserList.slice(0, lastUserList.length);
        uidList = lastUidList.slice(0, lastUidList.length);
        isFans = lastIsFans.slice(0, lastUidList.length);
        devilDrawAction.style.display = "none";
        randomKillLink.style.display = "none";
        if (confirm("要不要限定自己的粉丝？")) {
            for (var i = isFans.length; i > 0; i--) {
                if (!isFans[i - 1]) {
                    isFans.splice(i - 1, 1);
                    uidList.splice(i - 1, 1);
                    userList.splice(i - 1, 1);
                    if(isTrash.length > 0){
                        isTrash.splice(i - 1, 1);
                    }
                }
            }
        }
        if (isTrash.length > 0 && confirm("要不要拒绝抽奖号？")) {
            for (var i = isTrash.length; i > 0; i--) {
                if (isTrash[i - 1] > 6) {
                    isFans.splice(i - 1, 1);
                    uidList.splice(i - 1, 1);
                    userList.splice(i - 1, 1);
                    if(isTrash.length > 0){
                        isTrash.splice(i - 1, 1);
                    }
                }
            }
        }
        alert("等待抽奖的人数为" + uidList.length + "。");
        var winners = "获奖UID/用户名：";
        var links = "";
        var numbers = Number(prompt("抽几个？", "1"));
        if (numbers <= 0) {
            drawPanel.style.display = "none";
            return;
        }
        if (numbers > uidList.length) {
            alert("太多了，没那么多人转。");
            drawPanel.style.display = "none";
        } else {
            for (var i = 0; i < numbers; i++) {
                var rndIndex = Math.floor(Math.random() * uidList.length);
                winners = winners + "\n" + uidList[rndIndex] + "/" + userList[rndIndex];
                links = links + "<br><a target=\"_blank\" href = \"https://message.bilibili.com/#/whisper/mid" + uidList[rndIndex] + "\">发私信给" + userList[rndIndex] + "</a>"
                uidList.splice(rndIndex, 1);
                userList.splice(rndIndex, 1);
            }
            drawPanel.style.display = "";
            listDiv.innerText = winners;
            listDiv.innerHTML = listDiv.innerHTML + links;
            userList = [];
            uidList = [];
        }
    }
    function refreshListDiv() {
        listDiv.innerHTML = "";
        for (var i = 0; i < uidList.length; i++) {
            var btnUser = document.createElement("button");
            btnUser.innerText = userList[i];
            btnUser.name = "user_" + i;
            btnUser.style.padding = "0px 10px 0px 10px"
            btnUser.onclick = function () {
                var removeUid = Number(this.name.toString().split("_")[1]);
                userList.splice(removeUid, 1);
                uidList.splice(removeUid, 1);
                refreshListDiv();
            }
            listDiv.appendChild(btnUser);
        }
    }
    function devildraw() {
        userList = lastUserList.slice(0, lastUserList.length);
        uidList = lastUidList.slice(0, lastUidList.length);
        isFans = lastIsFans.slice(0, lastUidList.length);
        if (confirm("要不要限定自己的粉丝？")) {
            for (var i = isFans.length; i > 0; i--) {
                if (!isFans[i - 1]) {
                    isFans.splice(i - 1, 1);
                    uidList.splice(i - 1, 1);
                    userList.splice(i - 1, 1);
                }
            }
        }
        if (isTrash.length > 0 && confirm("要不要拒绝抽奖号？")) {
            for (var i = isTrash.length; i > 0; i--) {
                if (isTrash[i - 1] > 6) {
                    isFans.splice(i - 1, 1);
                    uidList.splice(i - 1, 1);
                    userList.splice(i - 1, 1);
                    if(isTrash.length > 0){
                        isTrash.splice(i - 1, 1);
                    }
                }
            }
        }
        alert("等待抽奖的人数为" + uidList.length + "。");
        devilDrawNum = Number(prompt("抽几个？", "1"));
        if (devilDrawNum <= 0) {
            drawPanel.style.display = "none";
            return;
        }
        if (devilDrawNum > uidList.length) {
            alert("太多了，没那么多人转。");
            drawPanel.style.display = "none";
            return;
        }
        devilDrawAction.style.display = "";
        randomKillLink.style.display = "";
        refreshListDiv();
        drawPanel.style.display = ""
    }

    function devilDrawAct() {
        var finalAct = false;
        var numbers = Math.floor(uidList.length / 2);
        if (devilDrawNum >= (uidList.length - numbers)) { numbers = uidList.length - devilDrawNum; devilDrawAction.style.display = "none"; randomKillLink.style.display = "none"; finalAct = true; }
        for (var i = 0; i < numbers; i++) {
            var rndIndex = Math.floor(Math.random() * uidList.length);
            uidList.splice(rndIndex, 1);
            userList.splice(rndIndex, 1);
        }
        if (finalAct) {
            var winners = "获奖UID/用户名：";
            var links = "";
            for (var i = 0; i < uidList.length; i++) {
                winners = winners + "\n" + uidList[i] + "/" + userList[i];
                links = links + "<br><a target=\"_blank\" href = \"https://message.bilibili.com/#/whisper/mid" + uidList[i] + "\">发私信给" + userList[i] + "</a>"
            }
            listDiv.innerText = winners;
            listDiv.innerHTML = listDiv.innerHTML + links;
            userList = [];
            uidList = [];
        } else {
            refreshListDiv();
        }
    }
    function killdraw() {
        var finalAct = false;
        var numbers = 1;
        if (devilDrawNum >= (uidList.length - numbers)) { numbers = uidList.length - devilDrawNum; devilDrawAction.style.display = "none"; randomKillLink.style.display = "none"; finalAct = true; }
        for (var i = 0; i < numbers; i++) {
            var rndIndex = Math.floor(Math.random() * uidList.length);
            uidList.splice(rndIndex, 1);
            userList.splice(rndIndex, 1);
        }
        if (finalAct) {
            var winners = "获奖UID/用户名：";
            var links = "";
            for (var i = 0; i < uidList.length; i++) {
                winners = winners + "\n" + uidList[i] + "/" + userList[i];
                links = links + "<br><a target=\"_blank\" href = \"https://message.bilibili.com/#/whisper/mid" + uidList[i] + "\">发私信给" + userList[i] + "</a>"
            }
            listDiv.innerText = winners;
            listDiv.innerHTML = listDiv.innerHTML + links;
            userList = [];
            uidList = [];
        } else {
            refreshListDiv();
        }
    }
    function startDraw() {
        alert("开始获取转发列表。");
        var syncDataStorage = JSON.parse(localStorage.getItem("drawStorage"));
        if (syncDataStorage) {
            var syncData = syncDataStorage[tid];
            if (syncData) {
                userList = syncData.userList;
                uidList = syncData.uidList;
                isFans = syncData.isFans;
            }
        }
        getNextForwardList();
    }

    function getNextForwardList(offset) {
        var queryString = "dynamic_id=" + tid;
        if (offset) {
            queryString = queryString + "&offset=" + offset;
        }
        var finalUrl = api_url + "?" + queryString;
        var xhttp = new XMLHttpRequest();
        xhttp.responseType = "json";
        xhttp.withCredentials = true;
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                try {
                    var recv = xhttp.response;
                    var nextOffset = recv.data.offset;
                    var items = Array.from(recv.data.items);
                    items.forEach(element => {
                        totalCount++;
                        if (uidList.indexOf(element.desc.uid) == -1) {
                            if (element.display.relation) {
                                var fansTemp;
                                if (element.display.relation.is_followed == 1) {
                                    fansTemp = true;
                                } else {
                                    fansTemp = false;
                                }
                                uidList.push(element.desc.uid);
                                userList.push(element.desc.user_profile.info.uname);
                                isFans.push(fansTemp);
                            }
                        }
                    });
                    if (recv.data.has_more !== 1) {
                        finalDraw();
                    } else {
                        getNextForwardList(nextOffset);
                    }
                } catch (e) {
                    alert("不知为何发生了点错误……");
                    console.log(e);
                }
            } else if (xhttp.readyState == 4 && xhttp.status != 200) {
                alert("不知为何发生了点错误……");
            }
        }
        xhttp.onerror = function (e) {
            alert("不知为何发生了点错误……");
            console.log(e);
        };
        try {
            xhttp.open("GET", finalUrl, true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send();
        } catch (exception) {
            alert("不知为何发生了点错误……");
            console.log(exception);
        }
    }
    function finalDraw() {
        alert("转发列表获取完成了，去重以后大概有" + uidList.length + "个人参与抽奖，总计获取到" + totalCount + "个数据。");
        totalCount = 0;
        lastUidList = uidList.slice(0, uidList.length);
        lastUserList = userList.slice(0, userList.length);
        lastIsFans = isFans.slice(0, isFans.length);
        tData.uidList = lastUidList;
        tData.userList = lastUserList;
        tData.isFans = lastIsFans;
        storageData[tid] = tData;
        localStorage.setItem("drawStorage", JSON.stringify(storageData));
        redrawLink.disabled = false;
        redrawLink.style.backgroundColor = "#f25d8e";
        devildrawLink.disabled = false;
        devildrawLink.style.backgroundColor = "#f25d8e";
        syncFollow.disabled = false;
        syncFollow.style.backgroundColor = "#f25d8e";
        if (confirm("下载转发列表？")) {
            if(downloadUrl !== null){URL.revokeObjectURL(downloadUrl);downloadUrl=null;}
            listDiv.innerHTML="";
            var csvContent = "\ufeff";
            for (var i = 0; i < uidList.length; i++) {
                csvString = csvString + "\n" + uidList[i] + "," + userList[i] + "," + isFans[i];
            }
            csvContent = csvContent + csvString;
            var blob = new Blob([csvContent], { type: 'text/csv;charset=gb2312;' });
            downloadUrl = URL.createObjectURL(blob);
            var link = document.createElement("a");
            link.setAttribute("target","_blank");
            link.setAttribute("href", downloadUrl);
            link.innerText = "保存档案（iOS请长按选择在新标签打开）";
            link.setAttribute("download", "drawlist.csv");
            listDiv.appendChild(link); drawPanel.style.display = "";
        }
        csvString = "UID,用户,是否粉丝";
        alert("准备完成了。");
    }
})();
