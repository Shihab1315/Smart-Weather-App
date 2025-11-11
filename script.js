let unit = "metric";
let hourlyChart;
let map;
let weatherLayer;
let effectCtx = document.getElementById("weatherEffect").getContext("2d");

function toggleUnit() {
  unit = document.getElementById("unit").value;
  const city = document.getElementById("city").value.trim();
  if(city) getWeather();
}

async function getWeather() {
  const city = document.getElementById("city").value.trim();
  const apiKey = "5ee03491e8175244704253b1214720ca"; // Replace with OpenWeather API Key
  if (!city) { alert("Please enter a city name!"); return; }

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${unit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) { alert(`Error: ${res.status} - ${res.statusText}`); return; }

    const data = await res.json();
    if (!data || !data.list) { alert("Unexpected response"); return; }

    // Background theme
    const currentCondition = data.list[0].weather[0].main.toLowerCase();
    const currentHour = new Date(data.list[0].dt_txt).getHours();
    let bgColor = "from-green-400 to-blue-400";
    if(currentHour >= 18 || currentHour < 6) bgColor = "from-gray-800 to-gray-600";
    else if (currentCondition.includes("rain")) bgColor = "from-blue-400 to-gray-500";
    else if (currentCondition.includes("cloud")) bgColor = "from-gray-400 to-blue-400";
    else if (currentCondition.includes("snow")) bgColor = "from-blue-200 to-white";
    else if (currentCondition.includes("clear")) bgColor = "from-yellow-400 to-orange-400";

    document.getElementById("body").className = `min-h-screen flex flex-col items-center justify-start font-poppins transition-colors duration-1000 py-10 bg-gradient-to-br ${bgColor}`;

    // Forecast cards
    const container = document.getElementById("forecast-container");
    container.innerHTML = "";
    for (let i=0;i<3;i++){
      const forecast = data.list[i*8];
      const temp = forecast.main.temp.toFixed(1);
      const condition = forecast.weather[0].main;
      const dt = new Date(forecast.dt_txt);
      const dayName = dt.toLocaleDateString("en-US",{weekday:"short"});

      let outfit="";
      if(condition.toLowerCase().includes("rain")) outfit="🌧️ Umbrella & waterproof shoes";
      else if(temp<15) outfit="🧥 Warm jacket & boots";
      else if(temp>=15 && temp<=25) outfit="👕 Light sweater";
      else outfit="🩳 Light clothes & sunglasses";

      let animationUrl="";
      if(condition.toLowerCase().includes("rain")) animationUrl="https://assets5.lottiefiles.com/packages/lf20_jt8mllyu.json";
      else if(condition.toLowerCase().includes("cloud")) animationUrl="https://assets5.lottiefiles.com/packages/lf20_q5pk6p1k.json";
      else if(condition.toLowerCase().includes("snow")) animationUrl="https://assets5.lottiefiles.com/packages/lf20_mf8kqpru.json";
      else animationUrl="https://assets5.lottiefiles.com/packages/lf20_iwmd6pyr.json";

      const card=document.createElement("div");
      card.className="bg-white/50 backdrop-blur-md rounded-2xl p-4 shadow-md flex flex-col items-center gap-2 w-60 transition transform hover:scale-105";
      card.innerHTML=`
        <h2 class="font-semibold text-lg">${dayName}</h2>
        <div id="lottie-${i}" class="w-20 h-20"></div>
        <p>🌡️ ${temp}${unit==="metric"?"°C":"°F"}</p>
        <p>☁️ ${condition}</p>
        <p class="font-medium text-gray-700">${outfit}</p>
      `;
      container.appendChild(card);
      lottie.loadAnimation({container: document.getElementById(`lottie-${i}`),renderer:"svg",loop:true,autoplay:true,path:animationUrl});
    }

    // Hourly chart (next 12h)
    const hourlyLabels=[]; const hourlyTemp=[];
    for(let i=0;i<4;i++){
      const forecast = data.list[i];
      const dt = new Date(forecast.dt_txt);
      hourlyLabels.push(`${dt.getHours()}:00`);
      hourlyTemp.push(forecast.main.temp.toFixed(1));
    }
    if(hourlyChart) hourlyChart.destroy();
    const ctx=document.getElementById("hourlyChart").getContext("2d");
    hourlyChart=new Chart(ctx,{
      type:'line',
      data:{
        labels:hourlyLabels,
        datasets:[{label:`Temperature (${unit==="metric"?"°C":"°F"})`,data:hourlyTemp,fill:true,borderColor:'#3B82F6',backgroundColor:'rgba(59,130,246,0.2)',tension:0.3}]
      },
      options:{responsive:true,plugins:{legend:{display:true}},scales:{y:{beginAtZero:false}}}
    });

    // Map
    const lat=data.city.coord.lat;
    const lon=data.city.coord.lon;
    if(!map) map=L.map('map').setView([lat,lon],10);
    else map.setView([lat,lon],10);
    if(weatherLayer) weatherLayer.remove();
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    weatherLayer=L.marker([lat,lon]).addTo(map).bindPopup(`${city} - ${currentCondition}`).openPopup();

    // Weather effects (rain/snow)
    startWeatherEffect(currentCondition);

  } catch(error){console.error(error); alert("Something went wrong! Check console.");}
}

// Simple rain/snow animation
function startWeatherEffect(condition){
  const canvas=document.getElementById("weatherEffect");
  const ctx=canvas.getContext("2d");
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
  const particles=[];
  for(let i=0;i<300;i++){
    particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vy:1+Math.random()*3,length:5+Math.random()*5});
  }
  function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle=condition.toLowerCase().includes("snow")?"white":"rgba(255,255,255,0.7)";
    particles.forEach(p=>{
      p.y+=p.vy;
      if(p.y>canvas.height) p.y=0;
      ctx.beginPath();
      if(condition.toLowerCase().includes("snow")) ctx.arc(p.x,p.y,p.length/2,0,Math.PI*2);
      else ctx.fillRect(p.x,p.y,2,p.length);
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
}
