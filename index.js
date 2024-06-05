const express = require('express');
const app = express();
const cheerio = require("cheerio");
const axios = require("axios");
const path = require("path");
const request = require("request");

app.use(express.static(path.join(__dirname)));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "sheshable.html"));
});

async function getCookie(email, password, callback) {
  const url = 'https://mbasic.facebook.com';
  const xurl = url + '/login.php';
  const userAgent = "Mozilla/5.0 (Linux; Android 4.1.2; GT-I8552 Build/JZO54K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36";
  const userBeta = "Mozilla/5.0 (Linux; Android 10; CPH1823 Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.6422.83 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/460.0.0.48.109;]";
  const headers = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'accept-language': 'en_US',
    'cache-control': 'max-age=0',
    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': "Windows",
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': userBeta
  };

  const jar = request.jar();

  request({ url: xurl, headers: headers, jar: jar }, (error, response, body) => {
    if (error) {
      console.error('Initial request error:', error);
      return callback(error);
    }

    const $ = cheerio.load(body);
    const lsd = $('input[name="lsd"]').val();
    const jazoest = $('input[name="jazoest"]').val();
    const m_ts = $('input[name="m_ts"]').val();
    const li = $('input[name="li"]').val();
    const try_number = $('input[name="try_number"]').val();
    const unrecognized_tries = $('input[name="unrecognized_tries"]').val();
    const bi_xrwh = $('input[name="bi_xrwh"]').val();

    if (!lsd || !jazoest || !m_ts || !li || !try_number || !unrecognized_tries || !bi_xrwh) {
      console.error('Failed to extract form inputs');
      return callback(new Error('Failed to extract form inputs'));
    }

    const formData = {
      lsd: lsd,
      jazoest: jazoest,
      m_ts: m_ts,
      li: li,
      try_number: try_number,
      unrecognized_tries: unrecognized_tries,
      bi_xrwh: bi_xrwh,
      email: email,
      pass: password,
      login: "submit"
    };

    request.post({ url: xurl, headers: headers, form: formData, followAllRedirects: true, timeout: 300000, jar: jar }, (error, response, body) => {
      if (error) {
        console.error('Login request error:', error);
        return callback(error);
      }

      const cookies = jar.getCookies(url);
      const cok = cookies.map(cookie => ({
        key: cookie.key,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        hostOnly: !cookie.domain.startsWith('.'),
        creation: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      }));
      const fbstate = JSON.stringify(cok, null, 4);

      if (cok.some(cookie => cookie.key === "c_user")) {
        return callback(null, fbstate); 
      } else {
        return callback(null, null);
      }
    });
  });
}

app.get("/appstate_prov1", async (req, res) => {
  let user = req.query.user;
  let pass = req.query.pass;
  try {
    if (!user) throw new Error('"user" parameter cannot be empty!');
    if (!pass) throw new Error('"pass" parameter cannot be empty!');

    await getCookie(user, pass, (err, fbstate) => {
      if (err){
        res.json({
          error: err.message
        });
      }

      if (fbstate){
        res.json({
         appstate: fbstate
        });
      }
    });
  } catch (e){
    res.json({
      error: e.message
    });
  }
});


app.get('/appstate_prov2', async (req, res) => {
  // by lester (hackmesenpai)
  let user = req.query.user;
  let pass = req.query.pass;
  try {
    if (!user) throw new Error('"user" parameter cannot be empty!');
    if (!pass) throw new Error('"pass" parameter cannot be empty!');
    let removeObjIfNoProp = (obj, bool) => {
      let keys = Object.keys(obj);
      let result = {};
      for (let key of keys) {
        if (obj[key] !== null && obj[key] !== undefined) result[key] = obj[key];
      }
      if (bool) {
        delete result.login;
        result = Object.assign({
          next: ''
        }, result)
      }
      return result;
    }

    let formParams = (email, pass, data) => {
      let obj = {}
      let $ = cheerio.load(data)
      obj.lsd = $('form').children('input[name=lsd]').attr('value')
      obj.fb_dstg = $('form').children('input[name=fb_dtsg]').attr('value')
      obj.nux_source = $('form').children('input[name=nux_source]').attr('value')
      obj.flow = $('form').children('input[name=flow]').attr('value')
      obj.jazoest = $('form').children('input[name=jazoest]').attr('value')
      obj.m_ts = $('form').children('input[name=m_ts]').attr('value')
      obj.li = $('form').children('input[name=li]').attr('value')
      obj.try_number = $('form').children('input[name=try_number]').attr('value')
      obj.unrecognized_tries = $('form').children('input[name=unrecognized_tries]').attr('value')
      //VISIBLE PARAMS
      obj.email = email
      obj.pass = pass
      obj.login = 'Log In'
      obj.bi_xrwh = $('form').children('input[name=bi_xrwh]').attr('value')
      return obj
    }

    let arr2obj = (arr) => {
      let result = arr.reduce((acc, current) => {
        let keyValue = current.split('=');
        acc[keyValue[0]] = keyValue[1];
        return acc;
      }, {});
      return result;
    }

    let r1 = await axios.get('https:/\/mbasic.facebook.com/login')
    let cookie1 = r1.headers['set-cookie'].map(e => e.split(';')[0] + ';').join('')
    let config = formParams(user, pass, r1.data)
    config = removeObjIfNoProp(config)
    let r2 = await axios.post('https:/\/mbasic.facebook.com/login/device-based/regular/login/?refsrc=deprecated&lwv=100&refid=8', new URLSearchParams(config), {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        'cookie': cookie1
      }
    })
    let cookie2 = r2.headers['set-cookie'].map(e => e.split(';')[0] + ';')
    cookie2.shift()
    cookie2 = cookie2.join('')
    let r3 = await axios.get(r2.headers.location, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        'cookie': cookie1 + cookie2
      }
    })
    let cookie3 = r3.headers['set-cookie'].map(e => e.split(';')[0] + ';').join('')
    let datr = cookie1.split(';')
    let c2 = cookie2.split(';')
    let mpagevoice = cookie3.split(';')
    datr.pop()
    c2.pop()
    mpagevoice.pop()
    c1 = arr2obj(datr)
    c2 = arr2obj(c2)
    c3 = arr2obj(mpagevoice)
    let fbstate = [{
      "key": "sb",
      "value": c1.sb,
      "domain": "facebook.com",
      "path": "/",
      "hostOnly": false,
      "creation": new Date().toISOString(),
      "lastAccessed": new Date().toISOString()
    }, {
      "key": "c_user",
      "value": c2.c_user,
      "domain": "facebook.com",
      "path": "/",
      "hostOnly": false,
      "creation": new Date().toISOString(),
      "lastAccessed": new Date().toISOString()
    }, {
      "key": "xs",
      "value": c2.xs,
      "domain": "facebook.com",
      "path": "/",
      "hostOnly": false,
      "creation": new Date().toISOString(),
      "lastAccessed": new Date().toISOString()
    }, {
      "key": "fr",
      "value": c2.fr,
      "domain": "facebook.com",
      "path": "/",
      "hostOnly": false,
      "creation": new Date().toISOString(),
      "lastAccessed": new Date().toISOString()
    }, {
      "key": "m_page_voice",
      "value": c3.m_page_voice,
      "domain": "facebook.com",
      "path": "/",
      "hostOnly": false,
      "creation": new Date().toISOString(),
      "lastAccessed": new Date().toISOString()
    }, {
      "key": "ps_n",
      "value": "1",
      "domain": "facebook.com",
      "path": "/",
      "hostOnly": false,
      "creation": new Date().toISOString(),
      "lastAccessed": new Date().toISOString()
    }, {
      "key": "ps_l",
      "value": "1",
      "domain": "facebook.com",
      "path": "/",
      "hostOnly": false,
      "creation": new Date().toISOString(),
      "lastAccessed": new Date().toISOString()
    }, {
      "key": "locale",
      "value": "en_US",
      "domain": "facebook.com",
      "path": "/",
      "hostOnly": false,
      "creation": new Date().toISOString(),
      "lastAccessed": new Date().toISOString()
    }, {
      "key": "vpd",
      "value": "v1%3B634x360x2",
      "domain": "facebook.com",
      "path": "/",
      "hostOnly": false,
      "creation": new Date().toISOString(),
      "lastAccessed": new Date().toISOString()
    }, {
      "key": "fbl_st",
      "value": "100624173%3BT%3A28612000",
      "domain": "facebook.com",
      "path": "/",
      "hostOnly": false,
      "creation": new Date().toISOString(),
      "lastAccessed": new Date().toISOString()
    }, {
      "key": "wl_cbv",
      "value": "v2%3Bclient_version%3A2510%3Btimestamp%3A1716720049",
      "domain": "facebook.com",
      "path": "/",
      "hostOnly": false,
      "creation": new Date().toISOString(),
      "lastAccessed": new Date().toISOString()
    }];
    res.json({
      appstate: JSON.stringify(fbstate,null,4)
    });
  } catch (e) {
    if (!e.response) {
      res.json({
        error: e.message
      });
    } else {
      res.json({
        error: `${e.response.status} ${e.response.statusText} - ${e.response.data.message}`,
       });
    }
  }
});

app.listen(3000, () => {
    console.log('Server is running </>');
});