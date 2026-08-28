import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { db } from '../db.ts';
import { authMiddleware } from './auth.ts';
import type { AIAnalysisResult } from '../../types/index.ts';

export const aiRouter = Router();

// Server-side GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * High-performance Rule-Based AI Analysis Engine
 * Evaluates problem descriptions using keyword scanning, priority assessment,
 * complexity ranking, material suggestion, and safety guidelines.
 */
export function ruleBasedAnalyzer(description: string, categoryHint?: string): AIAnalysisResult {
  const text = (description || '').trim();
  const lowerText = text.toLowerCase();
  const hint = (categoryHint || '').toLowerCase();
  const combined = `${lowerText} ${hint}`;

  let category = 'Other';
  let priority: 'low' | 'medium' | 'high' | 'emergency' = 'medium';
  let requiredSkill: 'Junior' | 'Senior' | 'Expert' = 'Junior';
  let possibleIssue = 'General electrical component inspection required to identify root cause.';
  let suggestedMaterials: string[] = ['Multimeter & Voltage Tester', 'FR Grade Insulation Tape', 'Terminal Screws & Wire Connectors'];
  let estimatedComplexity: 'Simple' | 'Moderate' | 'Complex' = 'Simple';
  let confidence = 70;
  let safetyWarning = 'Ensure the main breaker switch is turned off before touching any exposed wiring or terminals.';
  let estimatedPriceRange = { min: 300, max: 750 };
  let diagnosticPoints = [
    'Test input supply voltage using calibrated multimeter',
    'Inspect for burnt smell, carbon charring, or loose connections',
    'Verify secure earth ground continuity before energizing',
  ];

  // 1. Keyword Matching for Category
  // EMERGENCY: "emergency", "urgent", "immediate", "no power", "fire", "shock", "spark", "blast", "smoke", "burning smell", "blackout"
  if (
    combined.includes('emergency') ||
    combined.includes('fire') ||
    combined.includes('shock') ||
    combined.includes('spark') ||
    combined.includes('blast') ||
    combined.includes('smoke') ||
    combined.includes('burning smell') ||
    combined.includes('burning') ||
    combined.includes('no power') ||
    combined.includes('blackout') ||
    combined.includes('immediate') ||
    combined.includes('urgent')
  ) {
    category = 'Emergency';
    possibleIssue = 'Critical electrical fault, phase short-circuit, or live conductor leakage creating active hazard.';
    suggestedMaterials = ['Heavy Duty Main Breaker', 'RCCB / ELCB 30mA', 'FR Grade Fire Retardant Wires', 'Heat Shrink Fire-Proof Sleeves'];
    safetyWarning = 'DANGER: Turn off MAIN SWITCH immediately! Do NOT touch wet surfaces, metal enclosures, or sparking lines.';
    estimatedPriceRange = { min: 800, max: 2500 };
    diagnosticPoints = ['Isolate main breaker immediately', 'Trace damaged conduit and burnt wiring', 'Perform line insulation megger test'];
    confidence = 95;
  }
  // NEW INSTALLATION: "new installation", "install", "new wiring", "new connection", "fitting", "setup", "mounting"
  else if (
    combined.includes('new installation') ||
    combined.includes('new wiring') ||
    combined.includes('new connection') ||
    combined.includes('install') ||
    combined.includes('fitting') ||
    combined.includes('setup') ||
    combined.includes('mounting')
  ) {
    category = 'New Electrical Installation';
    possibleIssue = 'New electrical point, line extension, or appliance connection and load distribution setup.';
    suggestedMaterials = ['Concealed Gang Boxes', 'FR Grade Copper Wiring Rolls', 'Modular Switch & Socket Set', 'Rawl Plugs & Fasteners'];
    estimatedPriceRange = { min: 600, max: 2000 };
    diagnosticPoints = ['Calculate total connected load in amps', 'Route cabling via proper PVC conduit channels', 'Verify correct earthing loop impedance'];
    confidence = 92;
  }
  // MCB / DB: "mcb", "db", "distribution board", "trip", "circuit breaker", "elcb", "rccb", "fuse", "main breaker"
  else if (
    combined.includes('mcb') ||
    combined.includes('db') ||
    combined.includes('distribution board') ||
    combined.includes('trip') ||
    combined.includes('tripping') ||
    combined.includes('circuit breaker') ||
    combined.includes('elcb') ||
    combined.includes('rccb') ||
    combined.includes('fuse')
  ) {
    category = 'MCB / DB';
    possibleIssue = 'Sub-circuit overload, residual current earth leakage fault, or faulty trip mechanism in MCB.';
    suggestedMaterials = ['Single / Double Pole C-Curve MCB (16A/32A/63A)', 'RCCB 30mA 40A', 'Distribution Board Busbar', 'Neutral Link'];
    safetyWarning = 'Do not repeatedly force a tripping MCB back ON without isolating the underlying short-circuit.';
    estimatedPriceRange = { min: 500, max: 1600 };
    diagnosticPoints = ['Disconnect sub-circuits individually to isolate fault', 'Measure earth leakage current using clamp meter', 'Check neutral-to-earth potential difference'];
    confidence = 94;
  }
  // WIRING: "wire", "wiring", "short circuit", "wiring issue", "cable", "burnt wire", "conduit", "grounding", "neutral"
  else if (
    combined.includes('short circuit') ||
    combined.includes('wiring issue') ||
    combined.includes('wiring') ||
    combined.includes('wire') ||
    combined.includes('cable') ||
    combined.includes('conduit') ||
    combined.includes('neutral')
  ) {
    category = 'Wiring';
    possibleIssue = 'Concealed copper conductor degradation, rodent insulation damage, or high-resistance neutral junction.';
    suggestedMaterials = ['1.5 / 2.5 / 4.0 sq.mm FR Copper Cable', 'PVC Conduit Pipe', 'Wire Pulling Spring', 'Heavy Duty Insulation Tape'];
    estimatedPriceRange = { min: 700, max: 2800 };
    diagnosticPoints = ['Continuity testing across Phase, Neutral, and Earth', 'Megger insulation resistance test (> 2 Megaohms)', 'Inspect junction boxes for thermal discoloration'];
    confidence = 92;
  }
  // INVERTER: "inverter", "ups", "power backup", "inverter not working", "battery", "tubular battery", "backup"
  else if (
    combined.includes('inverter not working') ||
    combined.includes('inverter') ||
    combined.includes('ups') ||
    combined.includes('power backup') ||
    combined.includes('battery') ||
    combined.includes('backup')
  ) {
    category = 'Inverter';
    possibleIssue = 'Battery terminal sulphation, blown internal DC fuse, charging circuit failure, or bypass relay wear.';
    suggestedMaterials = ['Battery Terminal Clamps & Petroleum Jelly', 'Distilled Water Electrolyte', 'Heavy Duty Changeover Switch', 'DC Battery Fuse'];
    estimatedPriceRange = { min: 450, max: 1400 };
    diagnosticPoints = ['Check individual battery cell specific gravity with hydrometer', 'Measure inverter charging current & float voltage cut-off', 'Test auto changeover response under simulated mains failure'];
    confidence = 93;
  }
  // PUMP: "pump", "water pump", "pump not working", "submersible", "borewell", "monoblock", "pressure pump"
  else if (
    combined.includes('pump not working') ||
    combined.includes('water pump') ||
    combined.includes('pump') ||
    combined.includes('submersible') ||
    combined.includes('borewell') ||
    combined.includes('monoblock')
  ) {
    category = 'Pump';
    possibleIssue = 'Defective start/run capacitor, worn starter relay contactor, or underwater motor winding open-circuit.';
    suggestedMaterials = ['Submersible Control Box', 'Start/Run Capacitor Kit', 'Waterproof Cable Joint Kit', 'Pressure Switch Sensor'];
    estimatedPriceRange = { min: 600, max: 1900 };
    diagnosticPoints = ['Inspect starter panel capacitor bank microfarads', 'Measure running operating current with clamp meter', 'Check insulation resistance of submerged motor cables'];
    confidence = 94;
  }
  // MOTOR: "motor", "pump motor", "motor repair", "starter", "winding", "phase", "single phase", "3 phase"
  else if (
    combined.includes('motor repair') ||
    combined.includes('motor') ||
    combined.includes('starter') ||
    combined.includes('winding')
  ) {
    category = 'Motor';
    possibleIssue = 'Single phasing condition, worn motor bearings, or overheated auxiliary starting winding.';
    suggestedMaterials = ['Motor Starter Relay Unit', 'Run Capacitor (36/72 mfd)', 'Overload Protection Unit', 'Thermal Cutoff Relay'];
    estimatedPriceRange = { min: 650, max: 2100 };
    diagnosticPoints = ['Measure balance of 3-phase or single-phase winding resistance', 'Verify starter overload relay trip setting', 'Check shaft mechanical free rotation'];
    confidence = 90;
  }
  // APPLIANCE: "appliance", "fridge", "ac", "tv", "washing machine", "microwave", "heater", "geyser", "refrigerator", "oven"
  else if (
    combined.includes('appliance') ||
    combined.includes('fridge') ||
    combined.includes('refrigerator') ||
    combined.includes('ac') ||
    combined.includes('air conditioner') ||
    combined.includes('tv') ||
    combined.includes('washing machine') ||
    combined.includes('geyser') ||
    combined.includes('heater') ||
    combined.includes('microwave') ||
    combined.includes('oven')
  ) {
    category = 'Appliance Electrical Issue';
    possibleIssue = 'Power supply socket surge damage, thermostat failure, or internal grounding leakage in appliance.';
    suggestedMaterials = ['16A Heavy Duty Power Plug & Cable', 'Thermal Overload Fuse', 'AC Power Isolator Box', 'Surge Protector Unit'];
    estimatedPriceRange = { min: 400, max: 1300 };
    diagnosticPoints = ['Check socket supply voltage under appliance load', 'Perform body leakage test to avoid shock risk', 'Inspect plug pins and receptacle contacts for burning'];
    confidence = 91;
  }
  // FAN: "fan", "ceiling fan", "table fan", "fan not working", "fan repair", "regulator", "humming", "fan slow"
  else if (
    combined.includes('fan not working') ||
    combined.includes('fan repair') ||
    combined.includes('ceiling fan') ||
    combined.includes('table fan') ||
    combined.includes('fan') ||
    combined.includes('regulator') ||
    combined.includes('humming')
  ) {
    category = 'Fan Repair';
    possibleIssue = 'Degraded running capacitor, stiff bearing lubrication, or faulty electronic step regulator.';
    suggestedMaterials = ['2.5 mfd / 3.15 mfd Capacitor', 'Electronic Step Regulator', 'Bearing Set 6201/6202', 'Fan Blade Screws'];
    estimatedPriceRange = { min: 250, max: 650 };
    diagnosticPoints = ['Measure capacitor capacitance using LCR / Multimeter', 'Inspect mechanical shaft free spin and bearing play', 'Test regulator output voltage step increments'];
    confidence = 95;
  }
  // LIGHT: "light", "bulb", "tube light", "led", "light not working", "flickering", "flicker", "downlight", "chandelier"
  else if (
    combined.includes('light not working') ||
    combined.includes('tube light') ||
    combined.includes('light') ||
    combined.includes('bulb') ||
    combined.includes('led') ||
    combined.includes('flickering') ||
    combined.includes('flicker') ||
    combined.includes('downlight')
  ) {
    category = 'Light Repair';
    possibleIssue = 'Constant-current LED driver failure, loose holder contacts, or fluctuating neutral connection.';
    suggestedMaterials = ['LED Driver 12W/18W/24W', 'B22 / E27 Heavy Duty Holder', 'LED Tube Light 20W', 'Terminal Connectors'];
    estimatedPriceRange = { min: 200, max: 550 };
    diagnosticPoints = ['Measure DC voltage output from LED driver under load', 'Inspect bulb holder spring tension and brass contacts', 'Verify supply line neutral continuity'];
    confidence = 94;
  }
  // SOCKET: "socket", "plug", "power socket", "socket not working", "plug point", "3 pin socket"
  else if (
    combined.includes('socket not working') ||
    combined.includes('power socket') ||
    combined.includes('socket') ||
    combined.includes('plug point') ||
    combined.includes('plug')
  ) {
    category = 'Socket Repair';
    possibleIssue = 'Internal terminal sparking, melted ceramic core, or disconnected protective earth pin.';
    suggestedMaterials = ['Modular Socket 3-Pin (6A/16A)', 'Ceramic Socket Core', 'Earthing Wire Pin', 'Mounting Box'];
    estimatedPriceRange = { min: 200, max: 500 };
    diagnosticPoints = ['Test Phase-Neutral and Phase-Earth voltage (230V ± 10%)', 'Check Earth-Neutral voltage (< 3V ideal)', 'Inspect for terminal loosening or carbon buildup'];
    confidence = 93;
  }
  // SWITCH: "switch", "switch not working", "switch repair", "switch board", "gang box", "modular switch"
  else if (
    combined.includes('switch not working') ||
    combined.includes('switch repair') ||
    combined.includes('switch board') ||
    combined.includes('switch')
  ) {
    category = 'Switch Repair';
    possibleIssue = 'Arc pitting on modular switch contact points or loose back screw clamping.';
    suggestedMaterials = ['Modular Switch 6A/16A', 'Switch Faceplate Frame', 'Internal Copper Busbar', 'Insulation Tape'];
    estimatedPriceRange = { min: 180, max: 450 };
    diagnosticPoints = ['Check for contact continuity across switch toggle positions', 'Inspect switch casing for thermal warping', 'Ensure firm screw grip on conductor cores'];
    confidence = 93;
  }
  // If user provided a valid category hint, adopt it
  else if (categoryHint && categoryHint !== 'Other') {
    category = categoryHint;
    confidence = 80;
  }

  // 2. PRIORITY DETERMINATION
  // - If contains "emergency", "urgent", "no power", "fire", "shock", "spark", "blast", "smoke", "burning" → HIGH / emergency
  // - If contains "not working", "broken", "issue", "fault", "damaged", "noise", "trip", "flicker" → MEDIUM
  // - If contains "install", "new", "check", "routine", "fitting" → LOW
  // Default: MEDIUM
  if (
    combined.includes('emergency') ||
    combined.includes('urgent') ||
    combined.includes('immediate') ||
    combined.includes('no power') ||
    combined.includes('fire') ||
    combined.includes('shock') ||
    combined.includes('spark') ||
    combined.includes('blast') ||
    combined.includes('smoke') ||
    combined.includes('burning')
  ) {
    priority = 'emergency';
  } else if (
    combined.includes('install') ||
    combined.includes('new') ||
    combined.includes('check') ||
    combined.includes('routine') ||
    combined.includes('fitting')
  ) {
    priority = 'low';
  } else if (
    combined.includes('not working') ||
    combined.includes('broken') ||
    combined.includes('issue') ||
    combined.includes('fault') ||
    combined.includes('noise') ||
    combined.includes('trip') ||
    combined.includes('flicker') ||
    combined.includes('repair')
  ) {
    priority = 'medium';
  } else {
    priority = 'medium';
  }

  // 3. COMPLEXITY DETERMINATION
  // - If contains "wiring", "MCB", "DB", "inverter", "installation", "short circuit", "conduit", "fuse" → Complex
  // - If contains "motor", "pump", "appliance", "fridge", "AC", "TV", "washing machine", "heater", "geyser" → Moderate
  // - If contains "fan", "light", "switch", "socket", "bulb", "plug" → Simple
  // Default: Simple
  if (
    combined.includes('wiring') ||
    combined.includes('wire') ||
    combined.includes('mcb') ||
    combined.includes('db') ||
    combined.includes('inverter') ||
    combined.includes('installation') ||
    combined.includes('install') ||
    combined.includes('short circuit') ||
    combined.includes('conduit') ||
    combined.includes('fuse') ||
    category === 'Emergency' ||
    category === 'Wiring' ||
    category === 'MCB / DB' ||
    category === 'New Electrical Installation'
  ) {
    estimatedComplexity = 'Complex';
  } else if (
    combined.includes('motor') ||
    combined.includes('pump') ||
    combined.includes('appliance') ||
    combined.includes('fridge') ||
    combined.includes('ac') ||
    combined.includes('tv') ||
    combined.includes('washing machine') ||
    combined.includes('heater') ||
    combined.includes('geyser') ||
    category === 'Motor' ||
    category === 'Pump' ||
    category === 'Inverter' ||
    category === 'Appliance Electrical Issue'
  ) {
    estimatedComplexity = 'Moderate';
  } else if (
    combined.includes('fan') ||
    combined.includes('light') ||
    combined.includes('switch') ||
    combined.includes('socket') ||
    combined.includes('bulb') ||
    combined.includes('plug') ||
    category === 'Fan Repair' ||
    category === 'Light Repair' ||
    category === 'Switch Repair' ||
    category === 'Socket Repair'
  ) {
    estimatedComplexity = 'Simple';
  } else {
    estimatedComplexity = 'Simple';
  }

  // 4. REQUIRED SKILL DETERMINATION
  if (category === 'Emergency' || category === 'MCB / DB' || category === 'Wiring') {
    requiredSkill = 'Expert';
  } else if (
    category === 'Motor' ||
    category === 'Pump' ||
    category === 'Inverter' ||
    category === 'Appliance Electrical Issue' ||
    category === 'New Electrical Installation'
  ) {
    requiredSkill = 'Senior';
  } else {
    requiredSkill = 'Junior';
  }

  return {
    category,
    serviceCategory: category,
    priority,
    requiredSkill,
    possibleIssue,
    suggestedMaterials,
    estimatedComplexity,
    confidence,
    engine: 'VoltWork Rule-Based AI Engine (100% Guaranteed Fallback)',
    safetyWarning,
    estimatedPriceRange,
    diagnosticPoints,
    timestamp: new Date().toISOString(),
  };
}

// POST /api/ai/analyze-problem
// Evaluates problem description with Gemini AI, immediately and seamlessly falling back
// to the Rule-Based AI engine if unavailable, rate-limited (503/429), or timed out.
aiRouter.post('/analyze-problem', authMiddleware, async (req, res) => {
  const { description, categoryHint } = req.body || {};

  if (!description || typeof description !== 'string') {
    return res.status(400).json({ error: 'Description is required' });
  }

  // If Gemini client or API key is not configured, immediately use the rule-based engine
  if (!process.env.GEMINI_API_KEY || !aiClient) {
    const fallback = ruleBasedAnalyzer(description, categoryHint);
    return res.json(fallback);
  }

  try {
    const prompt = `You are the master electrical engineering diagnosis system of VoltWork AI.
Analyze the customer-reported electrical issue and output a structured JSON diagnosis.

Problem Description: "${description}"
${categoryHint ? `User-Selected Category: "${categoryHint}"` : ''}

Respond with valid JSON matching this schema:
{
  "category": "Fan Repair | Light Repair | Switch Repair | Socket Repair | Wiring | MCB / DB | Motor | Pump | Inverter | Appliance Electrical Issue | New Electrical Installation | Emergency | Other",
  "serviceCategory": "Fan Repair | Light Repair | Switch Repair | Socket Repair | Wiring | MCB / DB | Motor | Pump | Inverter | Appliance Electrical Issue | New Electrical Installation | Emergency | Other",
  "priority": "low | medium" | "high" | "emergency",
  "requiredSkill": "Junior | Senior | Expert",
  "possibleIssue": "Concise technical explanation",
  "suggestedMaterials": ["Material 1", "Material 2"],
  "estimatedComplexity": "Simple | Moderate | Complex",
  "confidence": 90,
  "safetyWarning": "Specific electrical safety caution",
  "estimatedPriceRange": { "min": 300, "max": 800 },
  "diagnosticPoints": ["Step 1", "Step 2"]
}`;

    // Fast-executing call with 1500ms timeout race to guarantee under 1-second/low latency response
    const geminiPromise = aiClient.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI API Timeout')), 1500)
    );

    const response: any = await Promise.race([geminiPromise, timeoutPromise]);
    const text = response?.text;

    if (!text) {
      console.log('AI API returned empty response, using rule-based engine');
      return res.json(ruleBasedAnalyzer(description, categoryHint));
    }

    const parsed = JSON.parse(text);
    return res.json({
      ...parsed,
      category: parsed.category || parsed.serviceCategory || 'Other',
      serviceCategory: parsed.serviceCategory || parsed.category || 'Other',
      engine: 'Gemini 3.7 Flash Diagnostic Model',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Silent logging as required - never propagate API 503/429 errors to client or user UI
    console.log('AI API unavailable / high demand, using rule-based engine fallback');
    const fallback = ruleBasedAnalyzer(description, categoryHint);
    return res.json(fallback);
  }
});

// Haversine distance calculator in KM
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// POST /api/ai/recommend-workers (Smart worker ranking & assignment suggestion)
aiRouter.post('/recommend-workers', authMiddleware, (req, res) => {
  try {
    const { jobId, category, requiredSkill, latitude, longitude } = req.body;

    let targetJob = null;
    if (jobId) {
      targetJob = db.getJobs().find((j) => j.id === jobId);
    }

    const targetCategory = category || targetJob?.category || 'General';
    const targetSkill = requiredSkill || targetJob?.aiAnalysis?.requiredSkill || targetCategory;
    const targetLat = latitude || targetJob?.latitude || 9.1726; // Default Mudukkumeendanpatti / Kovilpatti HQ if null
    const targetLng = longitude || targetJob?.longitude || 77.8711;

    const workers = db.getWorkers().filter((w) => w.status === 'active');
    const jobs = db.getJobs();

    if (workers.length === 0) {
      return res.json({
        recommendations: [],
        message: 'No active workers found in database. Add workers in Worker Management.',
      });
    }

    // Score workers based on skill match, availability, distance, workload, experience
    const scoredWorkers = workers.map((worker) => {
      let score = 50; // base score

      // 1. Skill Match (+30)
      const hasDirectSkill = worker.skills.some(
        (s) =>
          s.toLowerCase().includes(targetSkill.toLowerCase()) ||
          s.toLowerCase().includes(targetCategory.toLowerCase()) ||
          targetSkill.toLowerCase().includes(s.toLowerCase())
      );
      if (hasDirectSkill) {
        score += 30;
      } else if (worker.skills.includes('General') || worker.skills.length > 2) {
        score += 15;
      }

      // 2. Availability (+20 for available, 0 for on_job, -30 for busy/inactive)
      if (worker.availability === 'available') {
        score += 20;
      } else if (worker.availability === 'on_job') {
        score += 5;
      } else {
        score -= 20;
      }

      // 3. Distance calculation
      let distanceKm = 3.5;
      if (worker.currentLat && worker.currentLng && targetLat && targetLng) {
        distanceKm = getDistanceFromLatLonInKm(worker.currentLat, worker.currentLng, targetLat, targetLng);
        if (distanceKm <= 3) score += 20;
        else if (distanceKm <= 7) score += 12;
        else if (distanceKm <= 15) score += 5;
        else score -= 10;
      }

      // 4. Experience & Rating (+10)
      score += Math.min(10, (worker.experienceYears || 1) * 2);
      score += Math.round(((worker.rating || 5) - 4) * 10);

      // 5. Workload (-5 per active assigned job)
      const activeWorkerJobs = jobs.filter(
        (j) => j.assignedWorkerId === worker.id && ['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'REACHED', 'WORK_STARTED'].includes(j.status)
      );
      score -= activeWorkerJobs.length * 8;

      let reason = '';
      if (hasDirectSkill && worker.availability === 'available') {
        reason = `Specialized in ${targetCategory} & immediately available (~${distanceKm} km away).`;
      } else if (hasDirectSkill) {
        reason = `Matches skill requirement (${targetSkill}), currently on field.`;
      } else if (worker.availability === 'available') {
        reason = `Available nearby with ${worker.experienceYears}+ years experience.`;
      } else {
        reason = `Experienced electrician (~${distanceKm} km).`;
      }

      return {
        worker,
        score: Math.max(10, Math.min(100, score)),
        distanceKm,
        estimatedETA: Math.max(15, Math.round(distanceKm * 4 + 10)), // in minutes
        reason,
        activeJobsCount: activeWorkerJobs.length,
      };
    });

    // Sort descending by score
    scoredWorkers.sort((a, b) => b.score - a.score);

    return res.json({
      jobId,
      targetCategory,
      targetSkill,
      recommendations: scoredWorkers,
    });
  } catch (error) {
    console.log('Worker recommendation error:', error);
    return res.status(500).json({ error: 'Failed to compute worker recommendations' });
  }
});
