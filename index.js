const Nightmare = require('nightmare')
const page = Nightmare({ show: true })
console.log(page)
 
async function runBot() {
    try{
    
        await page.goto('https://instagram.com')
      await  page.wait('._aa4b')
      await page.type('._aa4b', 'marchettiatelierinc')
      await page.type('input[name="password"]', 'Vanessa2405')
      await page.wait('._acan._acap._acas._aj1-')
      await page.click('._acan._acap._acas._aj1-')
    await page.wait(5000) 
    await page.click('.x1i10hfl.xjbqb8w.x6umtig.x1b1mbwd.xaqea5y.xav7gou.x9f619.x1ypdohk.xt0psk2.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz._a6hd')
    await page.goto('https://instagram.com/?variant=following')
    
    
    
    // await page.type('body', 'Tab')
    
    
    
      //await page.end()
    } catch(error){
        console.log(error)
    }
    
    }
    
    runBot();