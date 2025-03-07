/**
 * 在 content-script 中使用的工具函数
 */
export function sendMessageToBackground(type: string, payload: any, callback?: Function) {
    browser.runtime.sendMessage({ type, payload }, (response: any) => {
        if (browser.runtime.lastError) {
            console.error("Error:", browser.runtime.lastError.message);
        } else {
            console.log("Response from background:", response);
            callback && callback(response);
        }
    });
}
export function getType(object: Object) {
    var toString = Object.prototype.toString;
    var map: any = {
        "[object Boolean]": "boolean",
        "[object Number]": "number",
        "[object String]": "string",
        "[object Function]": "function",
        "[object Array]": "array",
        "[object Date]": "date",
        "[object RegExp]": "regExp",
        "[object Undefined]": "undefined",
        "[object Null]": "null",
        "[object Object]": "object",
    };
    if (object instanceof Element) {
        return "element";
    }
    return map[toString.call(object)];
}
export function deepClone(data: any): any {
    const type = getType(data);
    let obj: any;
    if (type === "array") {
        obj = [];
    } else if (type === "object") {
        obj = {};
    } else {
        return data;
    }
    if (type === "array") {
        for (let i = 0, len = data.length; i < len; i++) {
            obj.push(deepClone(data[i]));
        }
    } else if (type === "object") {
        for (let key in data) {
            obj[key] = deepClone(data[key]);
        }
    }
    return obj;
}
export function getUserInfo() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const userString = window.localStorage.getItem("__user__");
            if (!userString) {
                return {};
            }
            const userInfo = JSON.parse(userString);
            return userInfo || {};
        } else {
            console.error("localStorage is not available");
            return {};
        }
    } catch (error) {
        console.error("Error parsing user info from localStorage", error);
        return {};
    }
}
/**
 * 将页面里的 特定图片 转为 base64
 * @param {HTMLDOMString} html
 * @param {Function} callback
 */
export function convertAllImg2Base64(html: string, callback: Function) {
    const reg = /<img class="(?:email|telphone|connect-img)" (?:\s*\S+=\S+\s*)*src="(\S+)"(?:\s*\S+=\S+\s*)*>/;
    const reg2 = /<img(?=[^>]*class=["'](email|telphone|connect-img)["'])[^>]*src=["'](.*?)["'].*?>/
    let matched: any;
    const results: any[] = [];
    let regResult = (matched = html.match(reg2)) ? true : false
    // if(matched = html.match(reg2)){
    //   console.log('解析成功222！匹配到的内容',matched)
    // }else {
    //   console.log("解析失败222！没有找到匹配项。");
    // }
    console.log('输出匹配结果', regResult)
    console.log('输出到匹配内容', matched)
    if (matched && matched.length == 3) {
        matched.splice(1, 1);
        console.log('是否返回数组长度是3', matched)
    }
    if (regResult) {
        const result = {
            source: matched[0], // 匹配到的 img 标签
            link: matched[1], // 匹配到的 src 链接
            replace: `###IMG_REPLACE_${results.length}###`, // 暂时替换成的占位符
            base64: "", // 即将转换成的 base64
            // shouldConvert: true		// 标志：是否转换
        };
        console.log(result);
        results.push(result);

        html = html.replace ? html.replace(result.source, result.replace) : html;
    } else {
        console.log("匹配失败！没有找到匹配项。");
    }

    const htmlWrapper = {
        html,
    };

    Promise.all(results.map((item) => _convertImg2Base64(htmlWrapper, item)))
        .then(() => {
            console.log(results);
            callback(htmlWrapper.html);
        })
        .catch((err) => {
            console.error(err);
        });
}

/**
 * 将图片通过 canvas 转成 Base64 格式
 * @param {Object<{ html }>} htmlWrapper
 * @param {Object<{ source, link }>} resultInfo
 * @param {Function} callback
 */
export function _convertImg2Base64(htmlWrapper: any, resultInfo: any) {
    let link = decodeURIComponent(resultInfo.link).replace(/&amp;/g, "&");
    const domain = window.location.origin;
    if (link.indexOf("data:image") != -1) {
        link = link;
    } else if (!/^https?:\/\//.test(link)) {
        link = domain + link;
    }

    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            img.src = link;
            img.onload = () => {
                // create canvas
                let canvas: any = document.createElement("canvas");
                let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
                // reset canvas
                ctx.canvas.width = img.width;
                ctx.canvas.height = img.height;

                // drawImage
                ctx.drawImage(img, 0, 0);
                const base64 = ctx.canvas.toDataURL();
                resultInfo.base64 = base64;

                // replace
                htmlWrapper.html = htmlWrapper.html
                    .replace(resultInfo.replace, resultInfo.source)
                    .replace(resultInfo.link, resultInfo.base64);

                canvas = null;
                resolve(true);
            };
        } catch (error) {
            reject(error);
        }
    });
}

