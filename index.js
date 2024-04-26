const bodyData = {
  action: 'get_more_upcoming',
  stop: '143',
  date: '2024-04-21',
  offset: '0',
  count: '5',
  time: '00:00'
}
const bodyString = new URLSearchParams(Object.entries(bodyData)).toString();
console.log(bodyString)

const startTime = Date.now();

fetch("https://www.chicagowatertaxi.com/wp-admin/admin-ajax.php", {
  "credentials": "include",
  "headers": {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.5",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Pragma": "no-cache",
    "Cache-Control": "no-cache"
  },
  "referrer": "https://www.chicagowatertaxi.com/Chicago-River-Boat-Stops/Ogilvie-Union/",
  "body": bodyString,
  "method": "POST",
  "mode": "cors"
})
  .then((res) => res.json())
  .then((data) => {
    const endTime = Date.now();
    console.log(data)
    console.log(`Took ${endTime - startTime}ms`)
  })