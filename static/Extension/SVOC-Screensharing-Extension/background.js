/* background page, responsible for actually choosing media */
chrome.runtime.onConnect.addListener(function (channel) {
    channel.onMessage.addListener(function (message) {
        switch(message.type) {
        case 'pexGetScreen':
            chrome.storage.local.get('pexAllowedDomains', function(value) {
                // let the app know that it can cancel the timeout
                message.type = 'pexGetScreenPending';
                channel.postMessage(message);
                value = value.pexAllowedDomains;
                domains = value ? JSON.parse(value) : [];
                console.log("Approved domains: " + domains);
                if (domains.indexOf(message.domain) == -1) {
                    approved = confirm(message.domain + " would like to use SVOC Screensharing Extension to share your screen.\n\nDo you want to allow this?");
                    if (approved) {
                        domains.push(message.domain);
                        chrome.storage.local.set({'pexAllowedDomains': JSON.stringify(domains)});
                    } else {
                        message.type = 'pexGetScreenDone';
                        message.sourceId = null;
                        return channel.postMessage(message);
                    }
                }

                var pending = chrome.desktopCapture.chooseDesktopMedia(message.options || ['screen', 'window'], 
                                                                       channel.sender.tab, function (streamid) {
                    // communicate this string to the app so it can call getUserMedia with it
                    message.type = 'pexGetScreenDone';
                    message.sourceId = streamid;
                    channel.postMessage(message);
                });
            });
            break;
        }
    });
});
