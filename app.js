const state = {
  platform: "cisco",
  scenario: "manufacturing",
  running: true,
  tick: 0,
  faultBoost: 0,
  history: {
    temperature: [],
    vibration: [],
    throughput: [],
    energy: []
  }
};

const platformProfiles = {
  cisco: {
    name: "Cisco IoT System",
    title: "Cisco IoT System Workflow",
    summary: "Cisco connects industrial assets through edge gateways, secure industrial networking, centralized management, Kinetic analytics, and fast local control.",
    analytics: "Kinetic Edge Analytics",
    network: "MQTT traffic flows through industrial routers with QoS, SD-WAN path selection, and encrypted links.",
    analyticsCopy: "Edge gateways filter noisy readings, prioritize safety packets, and send events to Kinetic analytics.",
    strength: "Edge response is fast, so actuator actions trigger quickly during hazardous readings.",
    workflow: [
      ["Edge Layer", "Sensors and IR gateways filter raw machine data."],
      ["Secure Network", "QoS, SD-WAN, Wi-Fi/5G, and encrypted transport move telemetry."],
      ["Control Center", "Device provisioning, OTA updates, and health checks stay centralized."],
      ["Kinetic Analytics", "Anomaly detection predicts failures close to the factory floor."],
      ["Actuation", "Alerts, work orders, cooling, and isolation close the feedback loop."]
    ],
    color: "#1769aa",
    latencyBonus: 0.88,
    aiBonus: 0.96,
    securityBonus: 0.9
  },
  ibm: {
    name: "IBM Watson IoT Platform",
    title: "IBM Watson IoT Platform Workflow",
    summary: "IBM Watson IoT models the full cloud-native data lifecycle: device onboarding, protocol connectivity, event ingestion, cognitive analysis, applications, and feedback.",
    analytics: "Watson AI Analytics",
    network: "MQTT, HTTP, CoAP, and WebSocket data streams are normalized through IBM Cloud ingestion services.",
    analyticsCopy: "Watson AI models forecast failures, inspect trends, and feed dashboards plus enterprise integrations.",
    strength: "Cognitive analysis is strong, so predictions become more accurate as historical data grows.",
    workflow: [
      ["Device Layer", "Sensors, actuators, RFID tags, cameras, and gateways publish device events."],
      ["Connectivity", "MQTT, HTTP, CoAP, WebSocket, TLS, 5G, LoRaWAN, and satellite links carry data."],
      ["Data Ingestion", "Event Streams normalize, filter, store, and manage high-volume telemetry."],
      ["Watson AI", "Machine learning predicts faults, detects anomalies, and explains trends."],
      ["Apps & Feedback", "Dashboards, APIs, alerts, OTA updates, and actuator commands improve operations."]
    ],
    color: "#6f4ba8",
    latencyBonus: 0.96,
    aiBonus: 0.84,
    securityBonus: 0.86
  }
};

const scenarios = {
  manufacturing: {
    label: "Smart manufacturing",
    tempBase: 72,
    vibrationBase: 2.2,
    throughputBase: 575,
    energyBase: 82,
    asset: "robotic arm bearing",
    alert: "Production line bearing anomaly detected."
  },
  energy: {
    label: "Energy management",
    tempBase: 66,
    vibrationBase: 1.5,
    throughputBase: 20,
    energyBase: 146,
    asset: "wind turbine gearbox",
    alert: "Blade stress and gearbox heat are above forecast."
  },
  transport: {
    label: "Intelligent transportation",
    tempBase: 81,
    vibrationBase: 3.1,
    throughputBase: 92,
    energyBase: 116,
    asset: "fleet engine block",
    alert: "Truck engine vibration pattern suggests service risk."
  },
  healthcare: {
    label: "Healthcare monitoring",
    tempBase: 37,
    vibrationBase: 0.8,
    throughputBase: 214,
    energyBase: 48,
    asset: "ICU monitoring gateway",
    alert: "Patient monitor gateway shows abnormal signal drift."
  }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const els = {
  platformBadge: $("#platformBadge"),
  scenarioBadge: $("#scenarioBadge"),
  stageTitle: $("#stageTitle"),
  analyticsTitle: $("#analyticsTitle"),
  analyticsCopy: $("#analyticsCopy"),
  networkCopy: $("#networkCopy"),
  stageSummary: $("#stageSummary"),
  workflowStrip: $("#workflowStrip"),
  riskDial: $("#riskDial"),
  packetDeliveryValue: $("#packetDeliveryValue"),
  packetMeter: $("#packetMeter"),
  runState: $("#runState"),
  toggleRun: $("#toggleRun"),
  injectFault: $("#injectFault"),
  resetSimulation: $("#resetSimulation"),
  deviceCount: $("#deviceCount"),
  networkQuality: $("#networkQuality"),
  stress: $("#stress"),
  securityPressure: $("#securityPressure"),
  deviceCountValue: $("#deviceCountValue"),
  networkQualityValue: $("#networkQualityValue"),
  stressValue: $("#stressValue"),
  securityValue: $("#securityValue"),
  scenarioSelect: $("#scenarioSelect"),
  sensorGrid: $("#sensorGrid"),
  eventLog: $("#eventLog"),
  messageRate: $("#messageRate"),
  temperatureValue: $("#temperatureValue"),
  vibrationValue: $("#vibrationValue"),
  throughputValue: $("#throughputValue"),
  energyValue: $("#energyValue"),
  decisionStatus: $("#decisionStatus"),
  predictionText: $("#predictionText"),
  actionText: $("#actionText"),
  securityText: $("#securityText")
};

const charts = {
  temperature: $("#temperatureChart"),
  vibration: $("#vibrationChart"),
  throughput: $("#throughputChart"),
  energy: $("#energyChart")
};

function setupSensors() {
  els.sensorGrid.innerHTML = "";
  for (let index = 0; index < 24; index += 1) {
    const sensor = document.createElement("div");
    sensor.className = "sensor";
    sensor.title = `Sensor ${index + 1}`;
    els.sensorGrid.append(sensor);
  }
}

function addEvent(message) {
  const item = document.createElement("li");
  const time = document.createElement("time");
  const text = document.createElement("span");
  time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  text.textContent = message;
  item.append(time, text);
  els.eventLog.prepend(item);
  while (els.eventLog.children.length > 10) {
    els.eventLog.lastElementChild.remove();
  }
}

function wave(amplitude, speed, offset = 0) {
  return Math.sin((state.tick + offset) / speed) * amplitude;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function controls() {
  return {
    devices: Number(els.deviceCount.value),
    network: Number(els.networkQuality.value),
    stress: Number(els.stress.value),
    security: Number(els.securityPressure.value)
  };
}

function calculateMetrics() {
  const profile = platformProfiles[state.platform];
  const scenario = scenarios[state.scenario];
  const input = controls();
  const loadFactor = input.devices / 15000;
  const stressFactor = input.stress / 100;
  const networkPenalty = (100 - input.network) / 100;
  const fault = state.faultBoost;

  const temperature = scenario.tempBase + wave(3.2, 5) + stressFactor * 24 + fault * 18;
  const vibration = scenario.vibrationBase + wave(0.35, 4, 2) + stressFactor * 4.8 + fault * 3.5;
  const throughput = Math.max(0, scenario.throughputBase * (1 - networkPenalty * 0.28) * (1 - stressFactor * 0.16) * (1 - fault * 0.2));
  const energy = scenario.energyBase + loadFactor * 24 + stressFactor * 30 + fault * 14 + wave(4.5, 6, 1);
  const liveNetworkJitter = wave(2.4, 3, 4) + Math.sin(state.tick / 2.2) * 1.1;
  const packetDelivery = clamp(input.network - loadFactor * 7 - input.security * 0.08 + liveNetworkJitter, 8, 99.8);
  const securityRisk = clamp(input.security * profile.securityBonus + networkPenalty * 28, 0, 100);
  const liveRiskDrift = wave(3.6, 4.5, 7);
  const failureRisk = clamp((temperature - scenario.tempBase) * 1.65 + vibration * 9.5 + stressFactor * 22 + fault * 28 + liveRiskDrift - profile.aiBonus * 6, 0, 100);
  const messageRate = Math.round(input.devices * (state.scenario === "healthcare" ? 0.18 : 0.11) * (input.network / 100));
  const latency = Math.round((18 + loadFactor * 90 + networkPenalty * 180) * profile.latencyBonus);

  return {
    temperature,
    vibration,
    throughput,
    energy,
    packetDelivery,
    securityRisk,
    failureRisk,
    messageRate,
    latency
  };
}

function pushHistory(metric, value) {
  const list = state.history[metric];
  list.push(value);
  if (list.length > 38) list.shift();
}

function drawChart(canvas, values, color) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "#d7e0e6";
  ctx.lineWidth = 1;
  for (let y = 24; y < height; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (values.length < 2) return;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(1, max - min);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - 14 - ((value - min) / spread) * (height - 28);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function updateSensors(risk) {
  const sensors = $$(".sensor");
  sensors.forEach((sensor, index) => {
    sensor.classList.remove("hot", "danger");
    const phase = (state.tick + index) % 8;
    if (phase < 2 || risk > 42) sensor.classList.add("hot");
    if (risk > 70 && index % 5 === state.tick % 5) sensor.classList.add("danger");
  });
}

function renderWorkflow(profile) {
  els.workflowStrip.innerHTML = "";
  profile.workflow.forEach(([title, detail], index) => {
    const step = document.createElement("article");
    step.className = "workflow-step";
    step.innerHTML = `
      <span>${String(index + 1).padStart(2, "0")}</span>
      <strong>${title}</strong>
      <p>${detail}</p>
    `;
    els.workflowStrip.append(step);
  });
}

function updateDecision(metrics) {
  const scenario = scenarios[state.scenario];
  const highRisk = metrics.failureRisk > 72;
  const mediumRisk = metrics.failureRisk > 48;
  const securityAlert = metrics.securityRisk > 62;

  document.body.classList.toggle("alert-mode", highRisk || securityAlert);
  els.decisionStatus.textContent = highRisk ? "Critical" : mediumRisk ? "Watch" : securityAlert ? "Security" : "Normal";

  if (highRisk) {
    els.predictionText.textContent = `${scenario.asset} may fail soon; predictive maintenance confidence is ${Math.round(metrics.failureRisk)}%.`;
    els.actionText.textContent = "Slow production, isolate affected asset, create urgent work order, and increase sampling rate.";
  } else if (mediumRisk) {
    els.predictionText.textContent = `${scenario.asset} is drifting outside its normal operating pattern.`;
    els.actionText.textContent = "Schedule inspection and route high-priority telemetry through the gateway.";
  } else {
    els.predictionText.textContent = "No immediate maintenance required.";
    els.actionText.textContent = "Continue monitoring at standard sampling rate.";
  }

  els.securityText.textContent = securityAlert
    ? `Security pressure is high. Segment devices and re-authenticate gateways; risk score ${Math.round(metrics.securityRisk)}%.`
    : "Zero-trust checks passing.";

  $$(".actuator").forEach((button) => {
    button.classList.remove("active", "warning", "danger");
    if (button.dataset.actuator === "Cooling") button.classList.add(highRisk ? "danger" : "active");
    if (button.dataset.actuator === "Maintenance" && mediumRisk) button.classList.add("warning");
    if (button.dataset.actuator === "Isolation" && highRisk) button.classList.add("danger");
  });
}

function render() {
  const profile = platformProfiles[state.platform];
  const scenario = scenarios[state.scenario];
  const metrics = calculateMetrics();
  const color = metrics.failureRisk > 72 ? "#b42318" : metrics.failureRisk > 48 ? "#c47b13" : profile.color;

  pushHistory("temperature", metrics.temperature);
  pushHistory("vibration", metrics.vibration);
  pushHistory("throughput", metrics.throughput);
  pushHistory("energy", metrics.energy);

  els.platformBadge.textContent = profile.name;
  els.scenarioBadge.textContent = scenario.label;
  els.stageTitle.textContent = profile.title;
  els.stageSummary.textContent = profile.summary;
  els.analyticsTitle.textContent = profile.analytics;
  els.analyticsCopy.textContent = profile.analyticsCopy;
  els.networkCopy.textContent = profile.network;
  if (els.workflowStrip.dataset.platform !== state.platform) {
    els.workflowStrip.dataset.platform = state.platform;
    renderWorkflow(profile);
  }
  els.packetDeliveryValue.textContent = `${metrics.packetDelivery.toFixed(1)}%`;
  els.packetMeter.style.width = `${metrics.packetDelivery}%`;
  els.packetMeter.style.background = metrics.packetDelivery < 60 ? "#b42318" : metrics.packetDelivery < 80 ? "#c47b13" : "#00827f";

  els.riskDial.textContent = `${Math.round(metrics.failureRisk)}%`;
  els.riskDial.parentElement.style.background = `conic-gradient(${color} 0deg, ${color} ${metrics.failureRisk * 3.6}deg, #e4ebf0 ${metrics.failureRisk * 3.6}deg)`;
  els.messageRate.textContent = `${metrics.messageRate.toLocaleString()} msg/s`;

  els.temperatureValue.textContent = `${metrics.temperature.toFixed(1)} ${state.scenario === "healthcare" ? "C body" : "C"}`;
  els.vibrationValue.textContent = `${metrics.vibration.toFixed(1)} mm/s`;
  els.throughputValue.textContent = `${Math.round(metrics.throughput).toLocaleString()} ${state.scenario === "energy" ? "MWh/day" : state.scenario === "transport" ? "routes/hr" : state.scenario === "healthcare" ? "events/hr" : "units/hr"}`;
  els.energyValue.textContent = `${Math.round(metrics.energy)} kW`;

  drawChart(charts.temperature, state.history.temperature, "#1769aa");
  drawChart(charts.vibration, state.history.vibration, "#c47b13");
  drawChart(charts.throughput, state.history.throughput, "#2f855a");
  drawChart(charts.energy, state.history.energy, "#6f4ba8");
  updateSensors(metrics.failureRisk);
  updateDecision(metrics);

  if (state.running && state.tick % 4 === 0) {
    const event = metrics.failureRisk > 72
      ? scenario.alert
      : metrics.securityRisk > 62
        ? "Security analytics flagged unusual device authentication attempts."
        : `${profile.name} processed ${metrics.messageRate.toLocaleString()} messages per second with ${Math.round(metrics.latency)} ms latency.`;
    addEvent(event);
  }

  state.faultBoost = Math.max(0, state.faultBoost - 0.012);
}

function updateControlLabels() {
  els.deviceCountValue.textContent = Number(els.deviceCount.value).toLocaleString();
  els.networkQualityValue.textContent = `${els.networkQuality.value}%`;
  els.stressValue.textContent = `${els.stress.value}%`;
  els.securityValue.textContent = `${els.securityPressure.value}%`;
}

function bindEvents() {
  $$(".segmented button").forEach((button) => {
    button.addEventListener("click", () => {
      state.platform = button.dataset.platform;
      $$(".segmented button").forEach((item) => item.classList.toggle("active", item === button));
      addEvent(`${platformProfiles[state.platform].name} selected. ${platformProfiles[state.platform].strength}`);
      render();
    });
  });

  els.scenarioSelect.addEventListener("change", () => {
    state.scenario = els.scenarioSelect.value;
    state.history.temperature = [];
    state.history.vibration = [];
    state.history.throughput = [];
    state.history.energy = [];
    addEvent(`${scenarios[state.scenario].label} scenario loaded.`);
    render();
  });

  [els.deviceCount, els.networkQuality, els.stress, els.securityPressure].forEach((input) => {
    input.addEventListener("input", () => {
      updateControlLabels();
      render();
    });
  });

  els.toggleRun.addEventListener("click", () => {
    state.running = !state.running;
    document.body.classList.toggle("paused", !state.running);
    els.runState.textContent = state.running ? "Running" : "Paused";
    els.runState.classList.toggle("paused", !state.running);
    els.toggleRun.textContent = state.running ? "Pause Simulation" : "Resume Simulation";
    addEvent(state.running ? "Simulation resumed." : "Simulation paused for inspection.");
  });

  els.injectFault.addEventListener("click", () => {
    state.faultBoost = 1;
    els.stress.value = Math.min(100, Number(els.stress.value) + 16);
    updateControlLabels();
    addEvent("Manual fault injected: bearing heat and vibration spike introduced.");
    render();
  });

  els.resetSimulation.addEventListener("click", () => {
    state.faultBoost = 0;
    state.tick = 0;
    els.deviceCount.value = 3500;
    els.networkQuality.value = 87;
    els.stress.value = 42;
    els.securityPressure.value = 18;
    Object.keys(state.history).forEach((key) => {
      state.history[key] = [];
    });
    els.eventLog.innerHTML = "";
    updateControlLabels();
    addEvent("Simulation reset to report-inspired baseline.");
    render();
  });
}

function loop() {
  if (state.running) {
    state.tick += 1;
    render();
  }
}

setupSensors();
bindEvents();
updateControlLabels();
addEvent("Simulation started: sensors publishing telemetry through the IoT architecture.");
for (let index = 0; index < 10; index += 1) {
  state.tick += 1;
  render();
}
setInterval(loop, 900);
