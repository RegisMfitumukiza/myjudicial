// Comprehensive seed data for legal specialties.
// Run: node prisma/seed-specialties.mjs
// Or call seedSpecialties() from the backend on first startup.

export const SPECIALTY_SEED_DATA = [
  // ── Civil Law ──
  { slug: "family_law", label: "Family Law", description: "Divorce, custody, adoption, maintenance, domestic relations", icon: "Users", group: "Civil", sortOrder: 1 },
  { slug: "property_law", label: "Property & Land Law", description: "Land disputes, titles, tenancy, property transactions, boundaries", icon: "Home", group: "Civil", sortOrder: 2 },
  { slug: "personal_injury", label: "Personal Injury", description: "Accidents, torts, damages, medical negligence, compensation claims", icon: "Heart", group: "Civil", sortOrder: 3 },
  { slug: "insurance_law", label: "Insurance Law", description: "Claims, coverage disputes, policy interpretation, subrogation", icon: "Shield", group: "Civil", sortOrder: 4 },
  { slug: "succession_probate", label: "Succession & Probate", description: "Wills, estates, inheritance, guardianship, estate administration", icon: "Scroll", group: "Civil", sortOrder: 5 },
  { slug: "consumer_protection", label: "Consumer Protection", description: "Defective products, unfair practices, warranty disputes, refunds", icon: "ShoppingBag", group: "Civil", sortOrder: 6 },

  // ── Criminal Law ──
  { slug: "criminal_defense", label: "Criminal Defense", description: "Representation, appeals, bail applications, criminal investigations", icon: "ShieldCheck", group: "Criminal", sortOrder: 10 },
  { slug: "cyber_crime", label: "Cyber Crime", description: "Online fraud, hacking, identity theft, digital evidence, data breaches", icon: "Monitor", group: "Criminal", sortOrder: 11 },
  { slug: "drug_offenses", label: "Drug Offenses", description: "Possession, trafficking, distribution, rehabilitation programs", icon: "AlertTriangle", group: "Criminal", sortOrder: 12 },
  { slug: "white_collar", label: "White Collar Crime", description: "Fraud, embezzlement, money laundering, corruption, financial crimes", icon: "Building", group: "Criminal", sortOrder: 13 },

  // ── Commercial Law ──
  { slug: "business_corporate", label: "Business & Corporate Law", description: "Company formation, governance, mergers, acquisitions, joint ventures", icon: "Briefcase", group: "Commercial", sortOrder: 20 },
  { slug: "contract_law", label: "Contract Law", description: "Drafting, review, negotiation, breach disputes, commercial agreements", icon: "FileText", group: "Commercial", sortOrder: 21 },
  { slug: "commercial_litigation", label: "Commercial Litigation", description: "Business disputes, shareholder conflicts, partnership disputes", icon: "Gavel", group: "Commercial", sortOrder: 22 },
  { slug: "banking_finance", label: "Banking & Finance", description: "Lending, securities, regulatory compliance, fintech, investment", icon: "Landmark", group: "Commercial", sortOrder: 23 },
  { slug: "intellectual_property", label: "Intellectual Property", description: "Patents, trademarks, copyrights, trade secrets, IP licensing", icon: "Lightbulb", group: "Commercial", sortOrder: 24 },
  { slug: "tax_law", label: "Tax & Revenue Law", description: "Tax planning, disputes, compliance, audits, transfer pricing", icon: "Calculator", group: "Commercial", sortOrder: 25 },
  { slug: "competition_law", label: "Competition & Antitrust", description: "Anti-competitive practices, merger control, market dominance", icon: "BarChart", group: "Commercial", sortOrder: 26 },

  // ── Employment Law ──
  { slug: "employment_law", label: "Employment Law", description: "Dismissal, workplace disputes, contracts, discrimination, harassment", icon: "Users", group: "Employment", sortOrder: 30 },
  { slug: "labor_relations", label: "Labor Relations", description: "Union negotiations, collective bargaining, industrial action", icon: "Handshake", group: "Employment", sortOrder: 31 },
  { slug: "workplace_safety", label: "Workplace Safety", description: "OSHA compliance, occupational hazards, injury claims, safety regulations", icon: "HardHat", group: "Employment", sortOrder: 32 },

  // ── Immigration ──
  { slug: "immigration_law", label: "Immigration Law", description: "Visas, permits, citizenship, asylum, deportation defense, work permits", icon: "Globe", group: "Immigration", sortOrder: 40 },
  { slug: "refugee_asylum", label: "Refugee & Asylum", description: "Asylum applications, refugee status, humanitarian protection", icon: "Heart", group: "Immigration", sortOrder: 41 },

  // ── Public & Administrative ──
  { slug: "constitutional_law", label: "Constitutional Law", description: "Fundamental rights, judicial review, constitutional petitions", icon: "Scale", group: "Public & Administrative", sortOrder: 50 },
  { slug: "administrative_law", label: "Administrative Law", description: "Government decisions, permits, judicial review, public procurement", icon: "Building2", group: "Public & Administrative", sortOrder: 51 },
  { slug: "human_rights", label: "Human Rights Law", description: "Civil liberties, discrimination, equality, public interest litigation", icon: "Heart", group: "Public & Administrative", sortOrder: 52 },
  { slug: "environmental_law", label: "Environmental Law", description: "Pollution, land use, climate regulations, environmental impact assessments", icon: "Leaf", group: "Public & Administrative", sortOrder: 53 },
  { slug: "local_government", label: "Local Government Law", description: "Municipal regulations, zoning, land use planning, local ordinances", icon: "MapPin", group: "Public & Administrative", sortOrder: 54 },

  // ── International ──
  { slug: "international_law", label: "International Law", description: "Treaties, cross-border disputes, diplomatic immunity, trade agreements", icon: "Globe", group: "International", sortOrder: 60 },
  { slug: "trade_commerce", label: "International Trade", description: "Export/import, customs, trade agreements, WTO compliance, sanctions", icon: "Truck", group: "International", sortOrder: 61 },

  // ── Specialized ──
  { slug: "medical_malpractice", label: "Medical Malpractice", description: "Healthcare negligence, misdiagnosis, surgical errors, patient rights", icon: "Stethoscope", group: "Specialized", sortOrder: 70 },
  { slug: "education_law", label: "Education Law", description: "School disputes, student rights, academic misconduct, education policy", icon: "GraduationCap", group: "Specialized", sortOrder: 71 },
  { slug: "media_entertainment", label: "Media & Entertainment", description: "Defamation, media rights, broadcasting, content regulation, entertainment contracts", icon: "Film", group: "Specialized", sortOrder: 72 },
  { slug: "sports_law", label: "Sports Law", description: "Athlete contracts, doping regulations, sports governance, licensing", icon: "Trophy", group: "Specialized", sortOrder: 73 },
  { slug: "mining_law", label: "Mining & Natural Resources", description: "Mining licenses, resource extraction, environmental compliance, community disputes", icon: "Mountain", group: "Specialized", sortOrder: 74 },
  { slug: "energy_law", label: "Energy Law", description: "Power generation, renewable energy, oil & gas, regulatory compliance", icon: "Zap", group: "Specialized", sortOrder: 75 },
  { slug: "telecom_regulatory", label: "Telecom & Regulatory", description: "Telecommunications regulation, spectrum licensing, data protection, digital compliance", icon: "Radio", group: "Specialized", sortOrder: 76 },
  { slug: "data_privacy", label: "Data Protection & Privacy", description: "GDPR compliance, data breaches, privacy policies, consent management", icon: "Lock", group: "Specialized", sortOrder: 77 },
  { slug: "maritime_admiralty", label: "Maritime & Admiralty", description: "Shipping disputes, cargo claims, marine insurance, port regulations", icon: "Ship", group: "Specialized", sortOrder: 78 },
  { slug: "agricultural_law", label: "Agricultural Law", description: "Land reform, crop disputes, agribusiness, food safety regulations", icon: "Wheat", group: "Specialized", sortOrder: 79 },
  { slug: "cooperative_law", label: "Cooperative Law", description: "Cooperative formation, governance, disputes, member rights, financial compliance", icon: "Users", group: "Specialized", sortOrder: 80 },
  { slug: "arbitration_mediation", label: "Arbitration & Mediation", description: "Alternative dispute resolution, mediation, arbitration proceedings, settlement negotiation", icon: "Handshake", group: "Specialized", sortOrder: 81 },

  // ── Other ──
  { slug: "other", label: "Other / Unsure", description: "Help me find the right area of law for my situation", icon: "HelpCircle", group: "Other", sortOrder: 99 },
];
