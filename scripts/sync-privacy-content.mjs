import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const enJsonPath = path.join(rootDir, 'myjudicial-frontend', 'messages', 'en.json');
const enLegalPagesPath = path.join(rootDir, 'myjudicial-frontend', 'messages', 'en', 'legalPages.json');
const frJsonPath = path.join(rootDir, 'myjudicial-frontend', 'messages', 'fr.json');
const rwJsonPath = path.join(rootDir, 'myjudicial-frontend', 'messages', 'rw.json');
const seedDataPath = path.join(rootDir, 'myjudicial-backend', 'prisma', 'content-pages-seed-data.ts');

const privacyEn = {
  meta: {
    title: "Privacy Policy | MyJudicial",
    description: "Learn how MyJudicial protects your personal data under Rwanda Law No. 058/2021 on Personal Data Protection and Privacy."
  },
  hero: {
    badge: "Data Protection & Privacy",
    title: "Privacy Policy",
    updated: "Last updated: September 2026",
    updatedPrefix: "Last updated:",
    toc: {
      title: "On this page",
      print: "Print"
    }
  },
  content: {
    cardTitle: "Data Protection Officer & Controller Contact",
    cardDesc: "For statutory requests, data access, or compliance inquiries under Rwanda Law No. 058/2021.",
    intro: "MyJudicial Ltd (\"MyJudicial\", \"we\", \"our\", or \"us\") respects your fundamental right to privacy and is steadfastly committed to safeguarding your personal data. This Privacy Policy informs you about how we collect, process, store, and protect your personal information when you access our legal services marketplace (myjudicial.com), and explains your statutory privacy rights under Rwanda Law No. 058/2021 of 13/10/2021 relating to the protection of personal data and privacy.",
    sections: [
      {
        title: "1. Who We Are & Controller Identity",
        text: "MyJudicial Ltd (\"MyJudicial\", \"we\", \"our\", or \"us\") operates the premier digital legal-services platform in Rwanda, connecting citizens, entrepreneurs, and institutions with verified, certified advocates and legal professionals. For the purposes of Law No. 058/2021 relating to the protection of personal data and privacy, MyJudicial is the Data Controller responsible for personal data processed through our website (myjudicial.com) and associated marketplace services.\n\nOur registered headquarters are located at Centenary House, 4th Floor, KN 3 Ave & KN 4 St, Nyarugenge Central Business District, P.O. Box 2848, Kigali, Rwanda. We have designated a Data Protection Officer (DPO) who can be contacted directly at legal@myjudicial.com for any statutory privacy requests or regulatory compliance inquiries."
      },
      {
        title: "2. Scope of Services & Application",
        text: "This Privacy Policy governs the collection, processing, and protection of personal data across all services offered by MyJudicial, including:\n\n• Citizen and business client directory browsing, legal search, and map-based advocate discovery;\n• Client intake wizard and AI-assisted case triage;\n• Appointment scheduling, consultation management, and LiveKit encrypted video conferencing;\n• Secure escrow custody for consultation fee deposits and releases;\n• Encrypted document storage in the MyJudicial legal vault (OCI Object Storage);\n• Verified advocate profile hosting, onboarding, and compliance credentialing.\n\nScope Boundary: This policy applies strictly to the technical platform and infrastructure managed by MyJudicial. When you retain an advocate for legal representation in court or formal legal advisory, that advocate acts as an independent professional bound by statutory legal professional privilege, the Rwanda Bar Association Code of Conduct, and their own professional secrecy duties."
      },
      {
        title: "3. Information We Collect",
        text: "We collect only personal data necessary to provide our digital legal marketplace services. We categorize collected information into the following categories:\n\n• Account & Authentication Data: Full legal name, email address, telephone number, one-way hashed passwords (Argon2/bcrypt), federated OAuth account IDs (Google, LinkedIn), preferred language, and account role (Citizen, Expert, Admin).\n• Advocate & Legal Expert Professional Data: Display name, professional biography, law firm affiliation, physical office address, Rwanda Bar Association (RBA) roll number, active practicing certificate, national ID/passport copy, academic diplomas, verified legal specialties, consultation fee rates, and Mobile Money payout phone numbers.\n• Consultation & Booking Records: Selected legal service category, consultation delivery mode (video, phone, in-person), appointment date and duration, client intake summary notes, meeting room identifiers, and reschedule/cancellation history.\n• In-Platform Communications: Direct messages exchanged between clients and legal advocates, file attachments (PDFs, court notices, contracts), and message delivery timestamps.\n• Legal Vault Documents: Confidential case files, contracts, pleadings, deeds, and identification documents uploaded to the user vault. Files are encrypted client-side using AES-256-GCM before storage in OCI Object Storage.\n• Financial & Escrow Records: Mobile Money transaction references (MTN Mobile Money, Airtel Money), AzamPay gateway transaction identifiers, platform commission calculations, escrow deposit and payout ledger records. MyJudicial does NOT store debit/credit card numbers or Mobile Money PINs.\n• AI Triage Inquiries: Case descriptions submitted in text or voice audio, in-memory transcriptions, detected legal specialties, urgency assessments, and estimated budget parameters.\n• Location Data: Geolocation coordinates provided on-demand for map discovery (defaults to Kigali Central Business District: -1.9441, 30.0619); advocate office coordinates.\n• Technical & Audit Logs: IP addresses, browser user agent strings, login records, and immutable audit logs (AuditLog) tracking sensitive platform events."
      },
      {
        title: "4. How We Collect Your Information",
        text: "We collect personal data through transparent, direct, and automated mechanisms:\n\n• Directly Provided by You: When creating an account, filling out profile fields, submitting intake forms, uploading documents to the vault, exchanging messages, or paying consultation fees.\n• Automated Interactions: During your navigation of the platform, essential cookies, device attributes, IP addresses, and diagnostic error telemetry are automatically recorded to ensure system integrity and security.\n• Legal Expert Submissions: When advocates apply to join MyJudicial, submitting professional credentials, Bar certificates, identification, and schedule rules.\n• Official Verification Cross-Checks: To ensure trust and consumer protection, our compliance team cross-checks submitted credentials directly against the public Roll of Advocates maintained by the Rwanda Bar Association."
      },
      {
        title: "5. Purposes & How We Use Your Data",
        text: "MyJudicial processes personal data exclusively for the following specified, legitimate purposes:\n\n• Marketplace Operation & Account Management: Administering user registrations, authentication, role authorization, and user profile management.\n• Advocate Verification & Fraud Prevention: Verifying advocate Bar standing, preventing unauthorized representation, and safeguarding consumer trust.\n• Booking & Virtual Consultations: Facilitating appointment scheduling, calendar synchronization, and establishing secure WebRTC video rooms via LiveKit.\n• Escrow & Financial Settlement: Holding consultation fee deposits in escrow custody and executing disbursements to legal experts upon verified consultation delivery.\n• Encrypted Document Vault Services: Providing high-security, client-side encrypted cloud storage for legal documentation and case evidence.\n• AI-Assisted Intake Triage & Case Classification: Providing automated legal subject-matter classification, urgency assessment, and lawyer matchmaking based on public practice areas.\n• Operational Notifications & Service Messaging: Dispatching appointment reminders, authentication OTPs, payment confirmations, and system notifications via Brevo (SMS and email).\n• Platform Security, Auditing & Legal Compliance: Detecting cyber threats, investigating disputes, maintaining immutable audit trails, and satisfying statutory tax and regulatory reporting obligations under Rwandan law."
      },
      {
        title: "6. Legal Basis for Processing (Law No. 058/2021)",
        text: "Pursuant to Article 46 of Rwanda Law No. 058/2021 relating to the protection of personal data and privacy, MyJudicial processes your personal data under the following lawful bases:\n\n• Performance of a Contract (Article 46(1)(b)): Processing is necessary for the conclusion and performance of the contract between you and MyJudicial (terms of service, booking management, escrow fee custody, document storage, and account access).\n• Compliance with a Legal Obligation (Article 46(1)(c)): Processing is necessary to satisfy statutory obligations under Rwandan commercial law, financial record-keeping, anti-money laundering regulations, tax filings with the Rwanda Revenue Authority (RRA), and lawful judicial summonses.\n• Legitimate Interests (Article 46(1)(f)): Processing is necessary for the legitimate business interests of MyJudicial and its users—specifically verifying advocate credentials on the Bar Roll, preventing fraud and unauthorized practice of law, protecting infrastructure security, and maintaining immutable audit trails—provided these interests do not override your fundamental rights.\n• Explicit Consent (Article 46(1)(a)): Where applicable, we rely on your specific, informed consent for optional features, including granting device geolocation for interactive map search and uploading voice audio recordings for AI transcription. Consent may be revoked at any time."
      },
      {
        title: "7. How We Share Information & Recipients",
        text: "We do not sell, rent, or monetize your personal data. We disclose personal information solely to the following defined categories of recipients:\n\n• Designated Legal Experts: When you initiate an intake inquiry or confirm a consultation booking, your contact information, issue description, and shared documents are provided directly to that advocate.\n• Core Cloud & Hosting Providers:\n  - Database & Identity Hosting: Supabase / Amazon Web Services (AWS) data centers.\n  - Encrypted Document Vault: Oracle Cloud Infrastructure (OCI) Object Storage with Key Management Service (KMS) envelope encryption.\n  - Real-Time Virtual Consultations: LiveKit Cloud infrastructure for encrypted WebRTC video rooms.\n  - Transactional Communications: Brevo (formerly Sendinblue) for transactional email, booking alerts, and SMS dispatch.\n  - In-Memory Caching & Session Rate-Limiting: Upstash Redis.\n  - Payment Gateway & Escrow Aggregation: AzamPay for Mobile Money checkout and automated advocate disbursements.\n• Rwanda Bar Association & Regulatory Bodies: In instances of professional misconduct inquiries or credential cross-referencing.\n• Judicial Authorities & Law Enforcement: Where strictly mandated under a legally binding court order, subpoena, or statutory warrant issued by a competent Rwandan judicial authority."
      },
      {
        title: "8. Client-Lawyer Confidentiality & Legal Privilege",
        text: "Legal Professional Privilege: Under Rwandan law and the statutory regulations of the Rwanda Bar Association, legal counsel consultations and case materials enjoy statutory professional secrecy (secret professionnel). The advocate you consult is legally bound to preserve the confidentiality of all information disclosed in contemplation of legal representation.\n\nTechnical Platform Safeguards: MyJudicial is engineered to uphold this sacred duty. Documents uploaded to the legal vault are encrypted client-side using AES-256-GCM. MyJudicial personnel, support teams, and third-party vendors do not possess access to decrypt or review confidential client-advocate communications or case evidence, except where strictly required for authorized administrative maintenance under audited conditions or when compelled by a valid Rwandan court order."
      },
      {
        title: "9. AI-Assisted Features & Machine Learning Transparency",
        text: "MyJudicial incorporates modern artificial intelligence features through our microservice (myjudicial-ai-service) to streamline case triage and intake:\n\n• Voice Transcription (Whisper): When you record an audio intake note, our local Whisper speech recognition model transcribes the speech to text in-memory. Audio streams are not retained after transcription completes.\n• Case Subject-Matter Classification: Our language model (self-hosted Ollama with Qwen2.5 or dedicated enterprise cloud inference) analyzes the factual description of your inquiry to identify primary legal areas (such as Land Law, Family Law, or Commercial Law) and evaluate urgency indicators.\n• Semantic Vector Search: The inquiry text is converted into mathematical vector embeddings (using sentence-transformers all-MiniLM-L6-v2) to match matters against published advocate experience.\n• ABSOLUTELY NO MODEL TRAINING: Personal case descriptions, uploaded documents, voice recordings, and consultation data are NEVER used to train, retrain, or improve public or proprietary foundation models.\n• Informational Nature: AI triage suggestions are strictly informational tools designed to assist you in navigating the legal marketplace. The AI does NOT provide legal advice, does not draft binding pleadings without advocate review, and never substitutes for a licensed human lawyer."
      },
      {
        title: "10. Automated Decision-Making & Recommendation Ranking",
        text: "NO Automated Legal Decisions: MyJudicial does NOT subject users to automated decision-making processes that produce legal effects or similarly significant consequences (such as automated rejection of service, automated account termination, or automated fee liability).\n\nTransparent Multi-Factor Ranking Logic: When clients search for legal experts, our recommendation engine orders search results using an objective, multi-factor algorithm based on:\n\n1. Semantic Relevance (40%): Alignment between the user's matter description and the advocate's verified practice profile;\n2. Advocate Rating (25%): Historical review ratings submitted by verified clients from completed consultations;\n3. Budget Fit (15%): Comparison between the advocate's published flat consultation rate and the client's declared budget;\n4. Verified Review Volume (10%): Total number of completed client reviews;\n5. Professional Experience (5%): Documented years of practice since Bar admission;\n6. Specialty Match (5%): Direct alignment with the advocate's designated primary legal specialty.\n\nUser Autonomy: This ranking score is purely a sorting mechanism for discoverability. Clients retain complete discretion to filter, compare, and select any registered advocate regardless of ranking order."
      },
      {
        title: "11. Location Data & Geospatial Search",
        text: "On-Demand Geolocation: To assist citizens in discovering legal advocates with physical chambers in their vicinity or jurisdiction, MyJudicial offers an interactive map feature. Your browser requests location permission strictly when you click to discover nearby advocates.\n\nDefault & Fallback Coordinates: If you decline permission or if your device does not support geolocation, the platform defaults to the central business coordinates of Kigali (Nyarugenge District: -1.9441, 30.0619).\n\nNo Background Tracking: Client geographic coordinates are transmitted temporarily to execute a radius distance query against advocate office coordinates (using PostGIS ST_DWithin geospatial functions). Client coordinates are never tracked in the background and are never stored in user account records or profile tables."
      },
      {
        title: "12. Cookies & Similar Technologies",
        text: "Session & Functional Cookies: We utilize strictly necessary cookies to maintain secure authentication sessions (NextAuth session tokens, CSRF tokens, and Supabase auth keys) and remember interface preferences (such as your chosen language: English, French, Kinyarwanda; and theme: light or dark mode).\n\nNo Third-Party Ad Trackers: We do not deploy third-party advertising or cross-site tracking cookies.\n\nDedicated Cookie Policy: For a complete inventory of cookie names, storage lifespans, purposes, and browser control settings, please review our standalone Cookie Policy at /cookies."
      },
      {
        title: "13. Data Retention & Archival Governance",
        text: "Transparent Data Lifecycle: We retain your personal data strictly for as long as necessary to fulfill the purposes for which it was collected and to satisfy statutory requirements under Rwandan law:\n\n• Active User Accounts: Identity and account credentials remain active until you delete your account or request account closure.\n• Statutory Accounting & Financial Ledgers: Consultation fee transactions, escrow settlement logs, and billing invoices are retained for ten (10) years in compliance with Rwandan tax laws, commercial code regulations, and anti-money laundering requirements.\n• Legal Vault Documents: Uploaded case documents remain stored in your private vault until you delete them or close your account.\n• Security & System Audit Logs: Audit trails (AuditLog) are maintained for security analysis, forensic investigation, and fraud prevention.\n• Data Governance Roadmap: In accordance with supervisory guidance from the Data Protection Office (DPO Rwanda), MyJudicial is actively codifying automated data lifecycle purging jobs to systematically delete staging records upon statutory expiry."
      },
      {
        title: "14. Technical & Organizational Security Controls",
        text: "We implement defense-in-depth security measures to protect your personal data against accidental loss, unauthorized access, alteration, or disclosure:\n\n• Encryption in Transit: All communications between your device and our servers are encrypted using Transport Layer Security (TLS 1.3 / HTTPS).\n• Encryption at Rest & Vault Security: Sensitive documents stored in Oracle Cloud Infrastructure (OCI) Object Storage are protected by client-side AES-256-GCM encryption with envelope keys managed via OCI Key Management Service (KMS).\n• Password Hashing: User passwords are protected using salted, cryptographic one-way hashes (Argon2/bcrypt); plaintext passwords are never recorded.\n• Role-Based Access Controls (RBAC): Strict permission boundaries separate Citizen, Expert, and Administrator capabilities, ensuring platform personnel cannot access confidential user data without specific operational justification.\n• Immutable Audit Logging: Security-critical actions (authentication, credential verification, file access, escrow releases) are permanently logged to dedicated audit tables with IP addresses and timestamps."
      },
      {
        title: "15. International Data Transfers (Articles 40-42)",
        text: "Infrastructure Location: To guarantee enterprise resilience, fault tolerance, and scalable performance, MyJudicial utilizes reputable global cloud providers whose server infrastructure is situated outside the Republic of Rwanda:\n\n• Core Database & Authentication: Supabase / Amazon Web Services (AWS) data centers located in the European Union and the United States;\n• Encrypted Document Vault: Oracle Cloud Infrastructure (OCI) Object Storage facilities located in the United States and the European Union;\n• Video Consultation Streaming: LiveKit Cloud infrastructure operating across global edge facilities;\n• Transactional Email & SMS Delivery: Brevo data centers located in the European Union;\n• Cache Storage: Upstash Redis clusters located in the European Union and the United States.\n\nStatutory Compliance: In accordance with Articles 40, 41, and 42 of Rwanda Law No. 058/2021, transfers of personal data outside Rwanda are conducted under robust legal safeguards, including comprehensive Data Processing Agreements (DPAs) with standard contractual clauses, state-of-the-art encryption at rest and in transit, and the necessity of transfer for the performance of our contract with you (Article 42)."
      },
      {
        title: "16. Your Privacy Rights Under Rwanda Law No. 058/2021",
        text: "As a data subject under Law No. 058/2021, you are entitled to the following statutory rights regarding your personal information:\n\n• Right to be Informed (Articles 15 & 16): Right to receive clear, concise, and transparent information regarding how your data is processed.\n• Right of Access (Article 16): Right to obtain confirmation of whether we hold personal data concerning you and to receive a structured copy of that data.\n• Right to Rectification (Article 18): Right to request the immediate correction of inaccurate or incomplete personal data. You may also update your account details directly in Profile Settings.\n• Right to Erasure / Deletion (Article 19): Right to request the permanent erasure of your personal data where it is no longer required for the purposes collected or where you withdraw consent, subject to statutory retention obligations under Rwandan tax and commercial laws.\n• Right to Restriction of Processing (Article 20): Right to obtain restriction of processing during verification of data accuracy or lawful processing disputes.\n• Right to Data Portability (Article 21): Right to receive your personal data in a structured, commonly used, machine-readable format.\n• Right to Object (Article 22): Right to object to processing founded on legitimate interests or direct informational communications.\n• Right to Withdraw Consent (Article 46): Where processing is based on consent, you may withdraw consent at any time without retroactive impact.\n\nHow to Exercise Your Rights: Submit your request in writing to our Data Protection Officer at legal@myjudicial.com. To safeguard your identity, we may require identity verification prior to acting on your request. We will acknowledge receipt promptly and provide a substantive response within the statutory thirty (30) day timeframe prescribed by Law No. 058/2021."
      },
      {
        title: "17. Children's Privacy (Under 18)",
        text: "Eighteen (18) Age Requirement: The MyJudicial marketplace is strictly intended for individuals who are at least eighteen (18) years of age and possess full legal capacity to enter into binding legal agreements under the laws of Rwanda.\n\nMinors Requiring Legal Services: Pursuant to Article 9 of Law No. 058/2021, personal data of a child can only be processed with the verified consent of a parent or legal guardian. If legal counsel is sought on behalf of a child or minor (e.g. in family matters, inheritance, or protection cases), the consultation must be initiated, authorized, and managed by their lawful parent or legal guardian. If we discover an unsupervised account registered by a child under 18, we will immediately terminate the account and purge the corresponding data."
      },
      {
        title: "18. Service Communications & Marketing Preferences",
        text: "Transactional Messages: We transmit essential operational communications by SMS and email, including appointment reminders, security OTP verification codes, booking confirmations, escrow release notifications, and critical platform security notices. These communications are integral to service fulfillment and account security, and users cannot opt out of transactional notices while their account remains active.\n\nMarketing & Educational Communications: If MyJudicial provides optional informational legal guides, quarterly legal insights, or platform feature announcements, you will be given a clear choice to opt in. Every marketing message contains an immediate unsubscribe link allowing you to opt out at any time without affecting your operational platform access."
      },
      {
        title: "19. Third-Party Websites & Integrations",
        text: "External Platform Boundaries: The MyJudicial website may feature links to external third-party platforms, such as the Rwanda Bar Association (rwanda-bar.org), government portals, judicial dockets, or payment provider authentication gateways.\n\nIndependent Privacy Policies: MyJudicial does not exercise control over the information practices or policies of external websites. Following links to third-party domains is conducted at your own discretion, and we strongly encourage you to review the privacy notices of any external site you visit."
      },
      {
        title: "20. Data Breach Response & Statutory Notification",
        text: "Incident Management Protocol: MyJudicial maintains a documented incident response procedure to swiftly detect, isolate, and remediate suspected personal data breaches or unauthorized access events.\n\n48-Hour Supervisory Notification: In compliance with Article 43 of Rwanda Law No. 058/2021, where an incident constitutes a personal data breach, MyJudicial will notify the National Cyber Security Authority / Data Protection Office (NCSA DPO) within forty-eight (48) hours of becoming aware of the breach.\n\nData Subject Notification: In accordance with Article 44 of Law No. 058/2021, if the breach is likely to result in a high risk to your rights, freedoms, or financial security, we will notify you without undue delay, detailing the nature of the breach, the potential consequences, and the remedial actions taken to safeguard your data."
      },
      {
        title: "21. Supervisory Authority Complaints (NCSA / DPO Rwanda)",
        text: "Internal Escalation: If you have questions or concerns regarding our privacy practices, we invite you to contact our Data Protection Officer first at legal@myjudicial.com.\n\nStatutory Right to Complain: You have the statutory right under Law No. 058/2021 to lodge a formal complaint with Rwanda's designated supervisory authority for data protection:\n\nNational Cyber Security Authority (NCSA)\nData Protection Office (DPO)\nOfficial Web Portal: https://dpo.gov.rw\nOfficial Email: dpo@ncsa.gov.rw\nPhysical Location: Kigali, Republic of Rwanda"
      },
      {
        title: "22. Policy Updates & Versioning",
        text: "Periodic Revision: We may update this Privacy Policy periodically to reflect technological enhancements, operational changes, or revised supervisory guidance from the Data Protection Office.\n\nEffective Date & Last Updated: The effective date at the top of this document indicates when the current version was promulgated.\n\nNotification of Material Modifications: When material changes are made that substantially impact your rights or data governance standards, we will provide advance notification via prominent banners across the platform or direct email communication. Previous revisions are archived in our content management system and remain accessible upon request to our privacy team."
      },
      {
        title: "23. Contact Us & Data Protection Officer",
        text: "For any inquiries regarding this Privacy Policy, your personal data, or the exercise of your statutory rights under Law No. 058/2021, please reach out to our privacy office:\n\n• Data Controller: MyJudicial Ltd\n• Data Protection Officer (DPO) Email: legal@myjudicial.com\n• Customer Support Email: support@myjudicial.com\n• Telephone Hotline: +250 788 312 456\n• Physical Address: Centenary House, 4th Floor, KN 3 Ave & KN 4 St, Nyarugenge Central Business District, Kigali, Rwanda\n• Postal Address: P.O. Box 2848, Kigali, Rwanda\n• Business Hours: Monday – Friday: 8:00 AM – 6:00 PM CAT"
      }
    ]
  }
};

const privacyFr = {
  meta: {
    title: "Politique de Confidentialité | MyJudicial",
    description: "Découvrez comment MyJudicial protège vos données personnelles conformément à la loi rwandaise n° 058/2021 sur la protection des données."
  },
  hero: {
    badge: "Protection des Données & Vie Privée",
    title: "Politique de Confidentialité",
    updated: "Dernière mise à jour : Septembre 2026",
    updatedPrefix: "Dernière mise à jour :",
    toc: {
      title: "Sur cette page",
      print: "Imprimer"
    }
  },
  content: {
    cardTitle: "Délégué à la Protection des Données et Siège Social",
    cardDesc: "Pour l'exercice de vos droits, l'accès aux données ou toute demande de conformité en vertu de la loi n° 058/2021.",
    intro: "MyJudicial Ltd (« MyJudicial », « nous », « notre » ou « nos ») respecte votre droit fondamental à la vie privée et s'engage rigoureusement à protéger vos données à caractère personnel. La présente Politique de Confidentialité vous informe des modalités de collecte, de traitement, de conservation et de sécurité de vos données lorsque vous accédez à notre plateforme de services juridiques (myjudicial.com), et précise les droits garantis par la loi rwandaise n° 058/2021 du 13/10/2021 relative à la protection des données à caractère personnel et de la vie privée.",
    sections: [
      {
        title: "1. Qui nous sommes et responsable du traitement",
        text: "MyJudicial Ltd (« MyJudicial », « nous », « notre » ou « nos ») exploite la première plateforme numérique de services juridiques au Rwanda, connectant les justiciables, les entrepreneurs et les organisations à des avocats et professionnels du droit vérifiés et certifiés. Au sens de la loi rwandaise n° 058/2021 relative à la protection des données à caractère personnel et de la vie privée, MyJudicial agit en qualité de responsable du traitement pour les données personnelles collectées et traitées sur notre site web (myjudicial.com) et ses services connexes.\n\nNotre siège social est situé à Centenary House, 4ème étage, KN 3 Ave & KN 4 St, Quartier des affaires de Nyarugenge, B.P. 2848, Kigali, Rwanda. Nous avons désigné un Délégué à la Protection des Données (DPO) joignable directement à l'adresse legal@myjudicial.com pour toute demande relative à vos droits ou à la conformité réglementaire."
      },
      {
        title: "2. Champ d'application des services",
        text: "La présente Politique de Confidentialité s'applique à la collecte, au traitement et à la protection des données personnelles sur l'ensemble des services MyJudicial, notamment :\n\n• La recherche d'avocats, la consultation de l'annuaire et la géolocalisation cartographique des cabinets ;\n• Le questionnaire d'accueil des clients et le triage des dossiers assisté par IA ;\n• La prise de rendez-vous, la gestion des consultations et la visioconférence sécurisée via LiveKit ;\n• Le système d'entiercement (escrow) pour la sécurisation des honoraires de consultation ;\n• Le coffre-fort numérique chiffré pour le stockage de pièces juridiques (stockage d'objets OCI) ;\n• La création de profil, la vérification et la gestion de la conformité des avocats agréés.\n\nLimite de champ : Cette politique s'applique à la plateforme et à l'infrastructure opérées par MyJudicial. Lorsque vous mandatez un avocat pour une représentation en justice ou un conseil formel, ce dernier agit en professionnel indépendant tenu au secret professionnel légal et aux règles déontologiques du Barreau du Rwanda."
      },
      {
        title: "3. Données que nous collectons",
        text: "Nous ne collectons que les données personnelles strictement nécessaires à la fourniture de nos services. Ces données sont classées comme suit :\n\n• Données de compte et d'authentification : Nom, prénom, adresse e-mail, numéro de téléphone, mot de passe haché de manière irréversible (Argon2/bcrypt), identifiants de connexion OAuth (Google, LinkedIn), langue préférée et rôle (Citoyen, Expert, Administrateur).\n• Données professionnelles des avocats : Nom d'exercice, biographie, cabinet d'attache, adresse physique, numéro d'inscription au Barreau du Rwanda (RBA), certificat de pratique valide, copie de carte nationale d'identité/passeport, diplômes académiques, spécialités juridiques, tarifs de consultation et numéro Mobile Money pour les reversements.\n• Données de réservation et de consultation : Type de service juridique, modalité d'exécution (visioconférence, téléphone, présentiel), date et créneau horaire, notes préparatoires du client, identifiant de salle de réunion et historique d'annulation/report.\n• Communications sur la plateforme : Messages directs échangés entre clients et avocats, pièces jointes (PDF, contrats, assignations) et horodatages de remise et de lecture.\n• Documents du coffre-fort juridique : Actes, contrats, preuves et documents d'identité versés au coffre-fort numérique, protégés par chiffrement client AES-256-GCM avant stockage dans l'infrastructure OCI.\n• Données financières et d'entiercement (Escrow) : Références de transaction Mobile Money (MTN, Airtel), identifiants AzamPay, montants consignés et reversements aux avocats. MyJudicial ne stocke JAMAIS les numéros de carte bancaire ni les codes secrets PIN Mobile Money.\n• Données de triage IA : Descriptif du litige soumis par écrit ou note vocale, transcriptions traitées en mémoire, domaine du droit identifié, degré d'urgence et fourchette budgétaire.\n• Données géographiques : Coordonnées GPS transmises à la demande pour la recherche sur carte (par défaut : Nyarugenge, Kigali : -1.9441, 30.0619) et coordonnées d'implantation des cabinets d'avocats.\n• Données techniques et journaux d'audit : Adresses IP, en-têtes du navigateur, horodatages de connexion et journaux d'audit immuables (AuditLog) traçant les actions critiques."
      },
      {
        title: "4. Modalités de collecte des données",
        text: "Nous collectons vos données personnelles selon des mécanismes directs, transparents et vérifiables :\n\n• Directement auprès de vous : Lors de la création de compte, de la saisie du profil, du questionnaire de prise en charge, du versement de pièces au coffre-fort, de l'envoi de messages ou du paiement d'une consultation.\n• Automatiquement lors de l'utilisation : Les témoins de connexion (cookies) essentiels, les paramètres techniques du terminal, les adresses IP et les journaux de diagnostic sont consignés pour garantir la sécurité et le bon fonctionnement du service.\n• Soumissions des professionnels du droit : Lorsque les avocats sollicitent leur inscription sur la plateforme et fournissent leurs diplômes, attestations du Barreau et créneaux de disponibilité.\n• Vérifications réglementaires officielles : Notre équipe de conformité vérifie systématiquement les mentions déclarées auprès du Tableau de l'Ordre officiel publié par le Barreau du Rwanda."
      },
      {
        title: "5. Finalités du traitement des données",
        text: "MyJudicial traite vos données personnelles uniquement pour des finalités licites, explicites et déterminées :\n\n• Gestion de la plateforme et des comptes : Enregistrement des utilisateurs, authentification sécurisée, gestion des droits et administration des profils.\n• Vérification des avocats et prévention de l'exercice illégal : Contrôle de l'inscription au Barreau, protection des justiciables et fiabilisation des titres professionnels.\n• Réservation et consultations virtuelles : Planification des rendez-vous, gestion des agendas et ouverture des salons de visioconférence WebRTC sécurisés via LiveKit.\n• Entiercement financier (Escrow) et reversements : Séquestre des honoraires de consultation et versement sur les comptes Mobile Money des avocats après réalisation de la prestation.\n• Coffre-fort numérique chiffré : Hébergement sécurisé et chiffré de bout en bout des dossiers juridiques, pièces de procédure et preuves documentaires.\n• Triage d'accueil assisté par IA : Analyse préliminaire du litige, évaluation de l'urgence et suggestion d'avocats pertinents selon leurs spécialités déclarées.\n• Notifications opérationnelles et communications de service : Envoi de rappels de rendez-vous, codes de sécurité (OTP), reçus de paiement et alertes par SMS et e-mail (Brevo).\n• Sécurité, audit et conformité légale : Détection des incidents de sécurité, résolution des différends, conservation des journaux d'audit et respect des obligations fiscales et légales au Rwanda."
      },
      {
        title: "6. Bases légales du traitement (Loi n° 058/2021)",
        text: "Conformément à l'article 46 de la loi rwandaise n° 058/2021 sur la protection des données personnelles, MyJudicial fonde ses traitements sur les bases juridiques suivantes :\n\n• Exécution d'un contrat (Article 46(1)(b)) : Le traitement est nécessaire à l'exécution de nos conditions de service et des prestations convenues avec vous (réservation de consultations, consignation d'honoraires en séquestre, coffre-fort numérique et gestion de votre compte).\n• Respect d'une obligation légale (Article 46(1)(c)) : Le traitement est requis pour respecter les lois commerciales rwandaises, les exigences de comptabilité financière, la lutte contre le blanchiment de capitaux, les déclarations auprès de l'Office Rwandais des Recettes (RRA) et les réquisitions judiciaires régulières.\n• Intérêts légitimes (Article 46(1)(f)) : Le traitement répond aux intérêts légitimes de MyJudicial et des justiciables, notamment pour vérifier l'authenticité des titres d'avocat sur le Tableau du Barreau, prévenir la fraude, sécuriser nos serveurs contre les intrusions et conserver des journaux d'audit, dans le respect de vos droits fondamentaux.\n• Consentement exprès (Article 46(1)(a)) : Nous sollicitons votre accord explicite pour certaines fonctionnalités facultatives, comme l'activation de la géolocalisation pour la carte ou la transmission de notes vocales pour transcription par IA. Ce consentement peut être retiré à tout moment."
      },
      {
        title: "7. Partage des données et destinataires",
        text: "Nous ne vendons, ne louons et ne commercialisons en aucun cas vos données personnelles. Celles-ci sont transmises uniquement aux catégories de destinataires suivantes :\n\n• Avocats et experts choisis : Lorsque vous sollicitez un avocat ou confirmez un rendez-vous, vos coordonnées, le résumé de votre litige et vos pièces partagées lui sont transmis pour lui permettre d'étudier votre dossier.\n• Fournisseurs d'infrastructure cloud et partenaires techniques :\n  - Hébergement base de données et authentification : Supabase / Amazon Web Services (AWS).\n  - Coffre-fort numérique chiffré : Oracle Cloud Infrastructure (OCI) Object Storage avec gestion des clés via OCI KMS.\n  - Visioconférence en temps réel : LiveKit Cloud pour les flux vidéo/audio WebRTC chiffrés.\n  - Communications transactionnelles : Brevo pour l'acheminement des e-mails, alertes de rendez-vous et SMS.\n  - Cache et gestion des sessions : Upstash Redis.\n  - Passerelle de paiement et séquestre : AzamPay pour les transactions Mobile Money et les reversements aux avocats.\n• Barreau du Rwanda et instances ordinales : Dans le cadre exclusif de la vérification d'inscription ou du traitement d'éventuels signalements déontologiques.\n• Autorités judiciaires et répressives : Uniquement lorsqu'une ordonnance judiciaire exécutoire ou une injonction légale valide nous est notifiée par une autorité judiciaire rwandaise compétente."
      },
      {
        title: "8. Confidentialité et secret professionnel de l'avocat",
        text: "Secret professionnel et privilège légal : Au regard du droit rwandais et des règles de l'Ordre des Avocats du Rwanda, les échanges et pièces confiés à un avocat dans le cadre d'un conseil ou d'une procédure bénéficient de la protection absolue du secret professionnel. L'avocat consulté est légalement tenu de préserver la confidentialité de toutes les informations reçues.\n\nGaranties techniques de la plateforme : MyJudicial est conçu pour respecter cette obligation déontologique fondamentale. Les documents versés au coffre-fort sont protégés par chiffrement client AES-256-GCM. Les équipes techniques et opérationnelles de MyJudicial n'ont aucun droit d'accès pour déchiffrer ou lire les dossiers de consultation ou les pièces confidentielles, hors impératif technique de maintenance strictement audité ou décision contraignante d'un tribunal rwandais."
      },
      {
        title: "9. Fonctionnalités d'intelligence artificielle et transparence",
        text: "MyJudicial intègre des outils d'intelligence artificielle via son microservice dédié (myjudicial-ai-service) pour faciliter le triage et l'orientation des justiciables :\n\n• Transcription vocale (Whisper) : Si vous enregistrez un message vocal pour exposer votre litige, notre moteur local Whisper convertit la parole en texte en mémoire vive. Le flux audio n'est pas conservé après transcription.\n• Qualification juridique préliminaire : Notre modèle linguistique (Ollama auto-hébergé avec Qwen2.5 ou inférence cloud sécurisée) analyse la description factuelle afin d'identifier la branche du droit applicable (Droit foncier, Droit de la famille, Droit commercial) et le niveau d'urgence.\n• Recherche sémantique vectorielle : Le texte de l'exposé est converti en représentations vectorielles (sentence-transformers all-MiniLM-L6-v2) pour vous proposer les avocats les plus adaptés à votre besoin.\n• AUCUN ENTRAÎNEMENT DE MODÈLES : Vos déclarations de faits, pièces jointes, enregistrements vocaux et échanges ne sont JAMAIS utilisés pour entraîner ou affiner des modèles d'IA publics ou propriétaires.\n• Caractère strictement informatif : Les analyses de l'IA constituent de simples suggestions d'orientation. L'IA ne fournit aucun conseil juridique, ne rédige aucun acte engageant et ne remplace en aucun cas l'analyse d'un avocat inscrit au Barreau."
      },
      {
        title: "10. Décisions automatisées et classement algorithmique",
        text: "Absence de décision juridique automatisée : MyJudicial ne prend AUCUNE décision automatisée produisant des effets juridiques ou vous affectant de manière significative (tel qu'un refus automatique d'accès, une résiliation unilatérale de compte ou une fixation arbitraire d'honoraires).\n\nAlgorithme transparent de classement des avocats : Lorsque vous effectuez une recherche, les profils d'avocats sont ordonnés selon un barème multicritère objectif et transparent :\n\n1. Pertinence sémantique (40 %) : Degré de correspondance entre la description de votre litige et le profil de l'avocat ;\n2. Note et avis des clients (25 %) : Moyenne des évaluations attribuées par des clients réels à l'issue de consultations effectives ;\n3. Adéquation budgétaire (15 %) : Rapprochement entre le tarif forfaitaire de l'avocat et votre budget indicatif ;\n4. Volume d'avis vérifiés (10 %) : Nombre de consultations évaluées ;\n5. Années d'expérience (5 %) : Ancienneté d'exercice depuis la prestation de serment au Barreau ;\n6. Spécialité principale (5 %) : Correspondance exacte avec la matière préférentielle déclarée.\n\nLibre choix du justiciable : Cet algorithme sert uniquement à ordonner l'affichage. Vous conservez la liberté totale de filtrer, comparer et solliciter l'avocat de votre choix, indépendamment du classement suggéré."
      },
      {
        title: "11. Données de localisation et recherche cartographique",
        text: "Géolocalisation à la demande : Pour vous aider à trouver des cabinets d'avocats proches de votre domicile ou de votre tribunal de ressort, MyJudicial propose une recherche sur carte interactive. Votre navigateur ne sollicite l'accès à votre position que si vous activez la fonction de recherche de proximité.\n\nPosition par défaut : Si vous refusez l'autorisation, la carte se positionne automatiquement sur le centre des affaires de Kigali (District de Nyarugenge : -1.9441, 30.0619).\n\nAbsence de suivi permanent : Vos coordonnées géographiques sont utilisées en mémoire vive uniquement pour calculer la distance par rapport aux cabinets référencés (fonctions PostGIS ST_DWithin). Elles ne sont jamais suivies en arrière-plan et ne sont jamais enregistrées dans votre profil utilisateur."
      },
      {
        title: "12. Témoins de connexion (Cookies) et technologies similaires",
        text: "Cookies essentiels et fonctionnels : Nous utilisons des cookies strictement nécessaires pour maintenir votre session de connexion sécurisée (jetons NextAuth, jetons anti-CSRF et clés de session Supabase) et mémoriser vos préférences (langue choisie : anglais, français, kinyarwanda ; affichage clair ou sombre).\n\nAbsence de traceurs publicitaires tiers : Nous n'utilisons aucun cookie de ciblage publicitaire ni aucun traceur comportemental tiers.\n\nPolitique relative aux cookies dédiée : Pour consulter la liste exhaustive des cookies utilisés, leur durée de conservation et les modalités de gestion, veuillez vous référer à notre Politique relative aux cookies accessible à l'adresse /cookies."
      },
      {
        title: "13. Durée de conservation et gouvernance des données",
        text: "Cycle de vie transparent des données : Nous ne conservons vos données que le temps strictement nécessaire à l'accomplissement des finalités prévues et au respect des exigences légales au Rwanda :\n\n• Comptes d'utilisateurs actifs : Les données d'identification et de profil sont conservées tant que votre compte demeure actif ou jusqu'à demande de clôture.\n• Pièces comptables et registres financiers : Les justificatifs de paiement, registres de séquestre (escrow) et factures sont conservés pendant dix (10) ans conformément au code de commerce rwandais et aux exigences fiscales de l'Office Rwandais des Recettes.\n• Pièces du coffre-fort juridique : Les documents juridiques versés au coffre-fort restent stockés jusqu'à suppression volontaire par l'utilisateur ou résiliation du compte.\n• Journaux d'audit et de sécurité : Les journaux traçant les accès et modifications (AuditLog) sont conservés à des fins d'analyse de sécurité et de prévention de la fraude.\n• Feuille de route de gouvernance : Conformément aux orientations du Bureau de Protection des Données (DPO Rwanda), MyJudicial formalise des routines automatisées de purge pour supprimer les fichiers temporaires dès l'échéance des délais légaux."
      },
      {
        title: "14. Mesures de sécurité techniques et organisationnelles",
        text: "Nous appliquons une politique de sécurité en profondeur pour prémunir vos données contre toute perte accidentelle, accès non autorisé, altération ou divulgation :\n\n• Chiffrement en transit : Toutes les communications entre votre navigateur et nos serveurs sont protégées par le protocole Transport Layer Security (TLS 1.3 / HTTPS).\n• Chiffrement au repos et coffre-fort : Les pièces déposées sur Oracle Cloud Infrastructure (OCI) sont protégées par chiffrement côté client AES-256-GCM avec gestion des clés d'enveloppe via OCI KMS.\n• Protection des mots de passe : Les mots de passe sont hachés avec sel au moyen d'algorithmes cryptographiques robustes (Argon2/bcrypt) ; aucun mot de passe en clair n'est jamais accessible.\n• Contrôle d'accès basé sur les rôles (RBAC) : Une stricte séparation des privilèges isole les accès entre Citoyens, Experts et Administrateurs, interdisant à notre personnel l'accès aux données sensibles sans motif d'exploitation impératif.\n• Traçabilité et journaux d'audit immuables : Les opérations sensibles (connexions, vérifications d'avocats, téléchargement de pièces, déblocage de séquestre) sont consignées dans des tables d'audit horodatées avec adresse IP."
      },
      {
        title: "15. Transferts internationaux de données (Articles 40-42)",
        text: "Localisation des infrastructures : Afin de garantir une haute disponibilité, une résilience éprouvée et une sécurité de niveau entreprise, MyJudicial fait appel à des prestataires cloud internationaux de premier plan dont les centres de données sont situés hors de la République du Rwanda :\n\n• Base de données et authentification : Supabase / Amazon Web Services (AWS) au sein de l'Union européenne et des États-Unis ;\n• Coffre-fort numérique chiffré : Oracle Cloud Infrastructure (OCI) au sein des États-Unis et de l'Union européenne ;\n• Visioconférences en temps réel : Réseau mondial de serveurs LiveKit Cloud ;\n• Envoi d'e-mails et SMS : Centres de données Brevo situés dans l'Union européenne ;\n• Mise en cache : Clusters Upstash Redis situés dans l'Union européenne et aux États-Unis.\n\nConformité légale : Conformément aux articles 40, 41 et 42 de la loi rwandaise n° 058/2021, ces transferts transfrontaliers sont encadrés par des garanties juridiques et techniques strictes, comprenant des accords de traitement des données (DPA) avec clauses contractuelles types, un chiffrement systématique des données et la nécessité du transfert pour l'exécution du contrat qui nous lie à vous (Article 42)."
      },
      {
        title: "16. Vos droits selon la Loi rwandaise n° 058/2021",
        text: "En tant que personne concernée par le traitement en vertu de la loi n° 058/2021, vous disposez des droits suivants sur vos données personnelles :\n\n• Droit à l'information (Articles 15 et 16) : Droit de recevoir une information claire, compréhensible et transparente sur nos pratiques de traitement.\n• Droit d'accès (Article 16) : Droit d'obtenir confirmation du traitement de vos données et d'en obtenir une copie structurée.\n• Droit de rectification (Article 18) : Droit d'exiger la mise à jour ou la correction immédiate de données inexactes ou incomplètes. Vous pouvez également modifier vos données courantes dans les paramètres de votre profil.\n• Droit à l'effacement / Droit à l'oubli (Article 19) : Droit d'obtenir la suppression de vos données lorsqu'elles ne sont plus nécessaires ou en cas de retrait de consentement, sous réserve des délais légaux de conservation fiscale et commerciale au Rwanda.\n• Droit à la limitation du traitement (Article 20) : Droit de geler temporairement le traitement pendant la vérification de l'exactitude de vos données.\n• Droit à la portabilité (Article 21) : Droit de recevoir vos données personnelles dans un format structuré et couramment lisible par machine.\n• Droit d'opposition (Article 22) : Droit de vous opposer pour motif légitime aux traitements fondés sur l'intérêt légitime.\n• Droit de retirer votre consentement (Article 46) : Lorsque le traitement repose sur votre accord, vous pouvez le retirer à tout moment sans incidence sur la licéité des traitements antérieurs.\n\nModalités d'exercice : Pour exercer vos droits, adressez votre demande par écrit à notre Délégué à la Protection des Données à legal@myjudicial.com. Une preuve d'identité pourra vous être demandée à des fins de sécurité. Nous accuserons réception sans délai et répondrons dans le délai légal de trente (30) jours fixé par la loi n° 058/2021."
      },
      {
        title: "17. Protection des mineurs (Moins de 18 ans)",
        text: "Condition de majorité légale (18 ans) : La plateforme MyJudicial est exclusivement réservée aux personnes majeures âgées d'au moins dix-huit (18) ans et disposant de la pleine capacité juridique pour contracter conformément aux lois de la République du Rwanda.\n\nAssistance juridique aux mineurs : Conformément à l'article 9 de la loi n° 058/2021, les données à caractère personnel d'un enfant ne peuvent être traitées sans le consentement expressément accordé par les titulaires de l'autorité parentale ou le tuteur légal. Si des conseils juridiques concernent un mineur (notamment en matière familiale, successorale ou de protection), la procédure doit être ouverte et gérée sous le contrôle direct du parent ou représentant légal. Si un compte s'avérait avoir été créé directement par un mineur sans autorisation légale, il sera immédiatement supprimé."
      },
      {
        title: "18. Communications de service et préférences marketing",
        text: "Messages opérationnels indispensables : Nous vous adressons par SMS et e-mail les notifications strictement nécessaires à l'exécution du service, notamment les rappels de consultation, les codes de vérification de sécurité (OTP), les confirmations de paiement et les alertes d'incident. Ces messages étant indispensables à la sécurité et à la fourniture de la prestation, vous ne pouvez pas vous en désinscrire tant que votre compte est ouvert.\n\nCommunications d'information et lettres d'actualités : Si vous choisissez de recevoir nos guides juridiques, publications éducatives ou annonces de nouvelles fonctionnalités, votre accord préalable est requis. Vous pouvez vous désabonner à tout moment via le lien de désinscription figurant en bas de chaque e-mail d'information."
      },
      {
        title: "19. Sites tiers et intégrations externes",
        text: "Liens vers des plateformes tierces : Le site MyJudicial peut comporter des liens hypertextes renvoyant vers des sites externes, tels que le portail officiel du Barreau du Rwanda (rwanda-bar.org), les services judiciaires publics ou les plateformes de paiement partenaires.\n\nIndépendance des politiques tierces : MyJudicial n'exerce aucun contrôle sur le contenu ou les pratiques de confidentialité de ces sites externes. L'accès à ces plateformes relève de votre responsabilité et nous vous invitons à consulter leurs politiques de protection des données respectives."
      },
      {
        title: "20. Gestion des incidents de sécurité et notification de violation",
        text: "Procédure de réaction aux incidents : MyJudicial applique un plan d'intervention structuré visant à détecter, contenir et corriger toute violation de sécurité ou intrusion suspectée.\n\nNotification à l'autorité sous 48 heures : Conformément à l'article 43 de la loi rwandaise n° 058/2021, en cas de violation de données personnelles, MyJudicial en informera l'Autorité Nationale de Cybersécurité / Bureau de Protection des Données (NCSA DPO) dans un délai maximal de quarante-huit (48) heures suivant sa découverte.\n\nInformation des personnes concernées : Conformément à l'article 44 de ladite loi, si la violation présente un risque élevé pour vos droits et libertés, vous en serez informé dans les plus brefs délais, avec communication des mesures correctives et des recommandations utiles pour préserver votre sécurité."
      },
      {
        title: "21. Réclamations auprès de l'Autorité de contrôle (NCSA / DPO Rwanda)",
        text: "Recours amiable préalable : Si vous estimez que le traitement de vos données n'est pas conforme aux exigences légales, nous vous invitons à saisir en premier lieu notre Délégué à la Protection des Données à legal@myjudicial.com.\n\nDroit de réclamation légal : Vous avez le droit légal, garanti par la loi n° 058/2021, d'introduire une réclamation officielle auprès de l'autorité de contrôle nationale du Rwanda :\n\nNational Cyber Security Authority (NCSA)\nData Protection Office (DPO)\nSite officiel : https://dpo.gov.rw\nE-mail officiel : dpo@ncsa.gov.rw\nSiège : Kigali, République du Rwanda"
      },
      {
        title: "22. Mises à jour et versions de la politique",
        text: "Révisions régulières : Nous pouvons actualiser la présente Politique de Confidentialité pour tenir compte des évolutions de notre infrastructure, des réformes législatives ou des directives publiées par le Bureau de Protection des Données.\n\nDate d'effet : La mention de dernière mise à jour figurant en tête de page atteste de la prise d'effet de la version en vigueur.\n\nNotification des modifications substantielles : En cas de modification importante impactant l'étendue de vos droits ou les finalités de traitement, nous vous en informerons préalablement par un avis visible sur la plateforme ou par e-mail direct. Les versions historiques sont archivées dans notre système de gestion de contenu et restent consultables sur demande."
      },
      {
        title: "23. Nous contacter et Délégué à la Protection des Données",
        text: "Pour toute question relative à la présente Politique de Confidentialité ou pour exercer vos droits garantis par la loi n° 058/2021, vous pouvez contacter notre service conformité :\n\n• Responsable du traitement : MyJudicial Ltd\n• E-mail du DPO : legal@myjudicial.com\n• E-mail du support : support@myjudicial.com\n• Téléphone : +250 788 312 456\n• Adresse physique : Centenary House, 4ème étage, KN 3 Ave & KN 4 St, Nyarugenge, Kigali, Rwanda\n• Boîte postale : B.P. 2848, Kigali, Rwanda\n• Heures d'ouverture : Du lundi au vendredi : 08h00 – 18h00 CAT"
      }
    ]
  }
};

const privacyRw = {
  meta: {
    title: "Politiki y'Ibanga | MyJudicial",
    description: "Menya uko MyJudicial irinda amakuru yawe bwite hakurikijwe Itegeko ry'u Rwanda nº 058/2021 ryerekeye kurinda amakuru bwite."
  },
  hero: {
    badge: "Kurinda Amakuru Bwite n'Ubuzima Bwite",
    title: "Politiki y'Ibanga",
    updated: "Iheruka kuvugururwa: Nzeri 2026",
    updatedPrefix: "Byahinduwe nyuma:",
    toc: {
      title: "Kuri uru rupapuro",
      print: "Capa"
    }
  },
  content: {
    cardTitle: "Umukozi Ushinzwe Kurinda Amakuru n'Ibiro Bikuru",
    cardDesc: "Ku busabe bw'amategeko, kureba amakuru yawe, cyangwa kubahiriza Itegeko ry'u Rwanda nº 058/2021.",
    intro: "MyJudicial Ltd (\"MyJudicial\", \"twebwe\", cyangwa \"byacu\") yubaha uburenganzira bwawe shingiro bw'ubuzima bwite kandi yiyemeje kubungabunga umutekano w'amakuru yawe bwite. Iyi Politiki y'Ibanga ikumenyesha uburyo dukusanya, dutunganya, tubika kandi turinda amakuru yawe igihe ukoresha urubuga rwacu rwa serivisi z'amategeko (myjudicial.com), ikanasobanura uburenganzira bwite uhabwa n'Itegeko ry'u Rwanda nº 058/2021 ryo ku wa 13/10/2021 ryerekeye kurinda amakuru bwite n'ubuzima bwite bw'umuntu.",
    sections: [
      {
        title: "1. Abo turi bo n'Ushinzwe Kugenzura Amakuru",
        text: "MyJudicial Ltd (\"MyJudicial\", \"twebwe\", cyangwa \"byacu\") ni urubuga rw'ikoranabuhanga rya mbere mu Rwanda ruhuza abaturage, abashoramari n'inzego z'ubucuruzi n'abavoka n'impuguke mu by'amategeko bemewe kandi bagenzuwe. Mu rwego rw'Itegeko nº 058/2021 ryo ku wa 13/10/2021 ryerekeye kurinda amakuru bwite n'ubuzima bwite bw'umuntu, MyJudicial niyo igenzura amakuru (Data Controller) atunganywa binyuze ku rubuga rwacu (myjudicial.com) na serivisi zijyanye na rwo.\n\nIbiro bikuru byacu biherereye muri Centenary House, Etaji ya 4, KN 3 Ave & KN 4 St, Nyarugenge Central Business District, P.O. Box 2848, Kigali, Rwanda. Twashyizeho Umukozi ushinzwe Kurinda Amakuru (DPO) ushobora kubonwa kuri imeri legal@myjudicial.com ku bibazo byose byerekeye uburenganzira bwite n'iyubahirizwa ry'amategeko."
      },
      {
        title: "2. Ibyo Iyi Politiki Ireba",
        text: "Iyi Politiki y'Ibanga igenga ikusanywa, itunganywa n'irindwa ry'amakuru bwite muri serivisi zose za MyJudicial, zirimo:\n\n• Gushakisha abavoka, gukoresha ikarita y'aho bakorera, no gusura imyirondoro yabo;\n• Kuzuza ifishi y'ikibazo cy'amategeko no gukoresha ubufasha bwa AI mu kumenya ibyiciro by'ikibazo;\n• Guhitamo igihe cyo guhura n'umwunganizi no gukoresha amashusho (LiveKit video);\n• Uburyo bwo kubika amafaranga y'ubujyanama mu buryo bwizewe (escrow) kugeza serivisi irangiye;\n• Ububiko bw'inyandiko z'ibanga zifunze n'imfunguzo z'ikoranabuhanga (OCI Object Storage);\n• Kumenyekanisha imyirondoro no kugenzura ibyangombwa by'abavoka bo mu Rugaga rw'Abavoka.\n\nIkitonderwa: Iyi politiki ireba ibikorwa by'ikoranabuhanga bya MyJudicial. Iyo ushyize umukono ku masezerano yo kwunganirwa n'umwavoka mu nkiko cyangwa mu zindi nzego, uwo mwavoka agengwa n'amahame y'umwuga w'ubuvoka n'ibanga ry'umwuga (professional secrecy) by'Urugaga rw'Abavoka mu Rwanda."
      },
      {
        title: "3. Amakuru Dukusanya",
        text: "Dukusanya gusa amakuru bwite akenewe kugira ngo dusohoze inshingano z'urubuga rwacu. Amakuru akusanywa agabanyije muri ibi byiciro bikurikira:\n\n• Amakuru y'Umwirondoro no Kwinjira: Amazina nyakuri, imeri, nimero ya telefoni, ijambobanga rifunze (Argon2/bcrypt), konti za Google/LinkedIn zikoreshwa mu kwinjira, ururimi uhitamo, n'icyiciro cyawe (Umuturage, Impuguke, Umuyobozi).\n• Amakuru y'Umwuga w'Abavoka: Amazina akoresha mu mwuga, amateka y'akazi, ibiro akoreramo, aderesi, nimero yo mu Rugaga rw'Abavoka (RBA Roll), icyemezo cyo gukora ubuvoka gifite agaciro, kopi y'indangamuntu cyangwa pasiporo, impamyabumenyi, ibyiciro by'amategeko akoreramo, ibiciro by'ubujyanama, na nimero ya Mobile Money yishyurirwaho.\n• Amakuru yo Guhura n'Ubujyanama: Ubwoko bwa serivisi, uburyo bwo guhura (amashusho, telefoni, guhura imbona nkubone), itariki n'isaha, inyandiko ngufi z'ikibazo, nimero y'icyumba cyo guhuriramo (meeting room ID), n'amateka yo gusubika cyangwa guhagarika.\n• Ubutumwa Bwo ku Rubuga: Ubutumwa bwandikiranwa hagati y'umukiriya n'umwunganizi, inyandiko zometseho (PDF, amasezerano, inyandiko z'urukiko), n'igihe ubutumwa bwagereye n'aho bwasomewe.\n• Inyandiko zo mu Bubiko Bw'Ibanga: Inyandiko z'imanza, amasezerano, n'ibimenyetso bishyirwa mu bubiko bw'ikoranabuhanga (Vault) bwo muri OCI, bikaba bifunze n'ingufuri ya AES-256-GCM ku buryo nta wundi ushobora kubibona.\n• Amakuru y'Imari n'Ubwishyu: Nimero z'ubwishyu (txRef), nimero zikoreshwa muri MTN Mobile Money na Airtel Money binyuze muri AzamPay, amafaranga yabitswe muri escrow, n'amafaranga yishyuwe umwavoka. MyJudicial NTIBIKA nimero z'amakarita ya banki cyangwa imibare y'ibanga (PIN) ya Mobile Money.\n• Amakuru y'Ubusesenguzi bwa AI: Ibisobanuro by'ikibazo byanditswe cyangwa byavuzwe mu ijwi, inyandiko yakuwe mu ijwi ikorwa mu kanya gato, ubwoko bw'amategeko ikibazo kibarizwamo, ubwihutirwe, n'ingengo y'imari igenekerejwe.\n• Amakuru y'Aho Uherereye: Imyirondoro y'aho uherereye (GPS) isabwa gusa igihe ushaka abavoka bakwegereye ku ikarita (iyo bidakozwe hafatwa Kigali CBD: -1.9441, 30.0619); n'aho ibiro by'abavoka biherereye.\n• Amakuru y'Ikoranabuhanga na Raporo z'Umutekano: Aderesi ya IP, amakuru ya porogaramu ukoresha (browser), igihe winjiriye, na raporo z'umutekano (AuditLog) zigaragaza ibikorwa bikomeye byakozwe ku rubuga."
      },
      {
        title: "4. Uko Dukusanya Amakuru Yawe",
        text: "Dukusanya amakuru bwite binyuze mu buryo busobanutse kandi bwemewe n'amategeko:\n\n• Utwibwiriye ubwawe: Igihe wiyandikisha ku rubuga, wuzuza imyirondoro, usobanura ikibazo cyawe mu ifishi, ushyira inyandiko mu bubiko, wandikira umwunganizi, cyangwa wishyura ubujyanama.\n• Bikozwe n'ikoranabuhanga mu buryo bwikora: Mu gihe ukoresha urubuga, dukusanya amakuru y'ibanze y'ikoranabuhanga (cookies, aderesi ya IP, amakuru ya mudasobwa cyangwa telefoni) kugira ngo urubuga rukore neza kandi rufite umutekano.\n• Amakuru atangwa n'abavoka: Igihe abavoka basaba gukorera kuri MyJudicial, batanga ibyangombwa by'umwuga, impamyabumenyi, n'amasaha babonekaho.\n• Igenzura ry'inzego zibifitiye ububasha: Itsinda ryacu rishinzwe igenzura risuzuma ibyangombwa byatanzwe ribigereranya n'Urutonde rw'Abavoka bemewe rwatangajwe n'Urugaga rw'Abavoka mu Rwanda."
      },
      {
        title: "5. Impamvu n'Uburyo Dukoresha Amakuru Yawe",
        text: "MyJudicial ikoresha amakuru bwite ku mpamvu zizwi, zemewe n'amategeko kandi zisobanutse neza gusa:\n\n• Gucunga urubuga no gufasha abakoresha kwinjira: Kwandika abakoresha bashya, gucunga imyirondoro, no kugenzura uburenganzira bw'abinjira muri buri cyiciro.\n• Kugenzura abavoka no kurinda uburiganya: Gusuzuma niba umwavoka yanditse mu Rugaga, kurinda ko hari abiyitirira ubuvoka, no kurengera abaturage bashaka ubutabera.\n• Gutegura gahunda z'ubujyanama no guhura mu buryo bw'amashusho: Gushyiraho gahunda yo guhura, guhuza za kalendari, no gufungura ibyumba by'amashusho byizewe (LiveKit).\n• Gucunga amafaranga mu buryo bwizewe (Escrow): Kubika amafaranga y'ubujyanama kugeza serivisi irangiye neza, no kuyashyikiriza umwavoka kuri Mobile Money.\n• Serivisi y'Ububiko bw'Inyandiko z'Ibanga (Vault): Kubika mu buryo bufunze kandi bwizewe inyandiko z'imanza n'amasezerano muri OCI.\n• Gusesengura ikibazo no gushaka abavoka bakwiye hifashishijwe AI: Gutahura mu kanya gato urwego rw'amategeko ikibazo kibarizwamo, ubwihutirwe, no kumenya abavoka babyigiye.\n• Kohereza ubutumwa bw'ingenzi bwa serivisi: Kohereza ubutumwa bubutsa gahunda, imibare y'umutekano (OTP), inyemezabwishyu n'ubutumwa bwa serivisi binyuze kuri SMS na imeri (Brevo).\n• Umutekano w'urubuga, kugenzura ibikorwa no kubahiriza amategeko: Gutahura ibitero by'ikoranabuhanga, gukemura impaka, kubika raporo z'umutekano (AuditLog), no gutanga raporo ziteganywa n'amategeko y'u Rwanda."
      },
      {
        title: "6. Ishingiro ry'Amategeko ryo Gutunganya Amakuru (Itegeko nº 058/2021)",
        text: "Hifashishijwe Ingingo ya 46 y'Itegeko ry'u Rwanda nº 058/2021 ryerekeye kurinda amakuru bwite n'ubuzima bwite bw'umuntu, MyJudicial itunganya amakuru yawe yisunze ibi bishingiro bikurikira:\n\n• Gusohoza amasezerano (Ingingo ya 46(1)(b)): Itunganywa ry'amakuru ni ngombwa kugira ngo dusohoze amasezerano y'imikoranire twagiranye nawe (amabwiriza y'urubuga, gufata gahunda y'ubujyanama, kubika amafaranga muri escrow, no gukoresha ububiko bw'inyandiko).\n• Kubahiriza inshingano z'amategeko (Ingingo ya 46(1)(c)): Amategeko y'ubucuruzi mu Rwanda, kubika inyandiko z'ibaruramari, kurwanya iyezandonke, gutanga umusoro mu Kigo cy'Imisoro n'Amahoro (RRA), no kubahiriza amabwiriza y'inkiko z'u Rwanda.\n• Inyungu zemewe n'amategeko (Ingingo ya 46(1)(f)): Inyungu z'ubucuruzi bwemewe za MyJudicial n'iz'abakoresha urubuga—by'umwihariko kugenzura niba abavoka banditse ku Rutonde rw'Urugaga, gukumira uburiganya, kurinda umutekano w'urubuga, no kubika inyandiko z'ibyakozwe (AuditLog)—igihe cyose bitabangamiye uburenganzira bwawe shingiro.\n• Uburenganzira butanzwe na nyir'ubwite (Ingingo ya 46(1)(a)): Ku bintu bimwe na bimwe bitari itegeko, tugusaba uburenganzira busobanutse, nko gutanga amakuru y'aho uherereye kugira ngo ubone abavoka bakwegereye, cyangwa gukoresha ijwi mu kwandika ikibazo cyawe hifashishijwe AI. Ushobora guhagarika ubu burenganzira igihe icyo ari cyo cyose."
      },
      {
        title: "7. Abahabwa Amakuru n'Uko Asangizwa",
        text: "Ntabwo ducuruza, ntitukodesha, kandi ntitugurisha amakuru yawe bwite na rimwe. Amakuru asangizwa gusa ibi byiciro bikurikira byateganyijwe:\n\n• Abavoka wahisemo kugisha inama: Iyo ufashe gahunda yo kugisha inama umwavoka, amakuru yawe, incamake y'ikibazo, n'inyandiko wageneye uwo mwavoka bimugeraho mu buryo butaziguye.\n• Abafatanyabikorwa mu by'ikoranabuhanga n'ububiko bwo mu bicu:\n  - Ububiko bw'amakuru n'imyirondoro: Supabase / Amazon Web Services (AWS).\n  - Ububiko bufunze bw'inyandiko (Vault): Oracle Cloud Infrastructure (OCI) hamwe n'uburyo bwo gucunga imfunguzo za KMS.\n  - Amashusho yo kugisha inama mu buryo bw'ako kanya: LiveKit Cloud ikoresha uburyo bwa WebRTC bufite umutekano ukomeye.\n  - Kohereza ubutumwa: Brevo ikoreshwa mu kohereza imeri na SMS zibutsa gahunda cyangwa zitanga imibare y'umutekano (OTP).\n  - Kubika amakuru akenerwa vuba: Upstash Redis.\n  - Kumenyekanisha no kwishyura amafaranga: AzamPay ifasha mu kwakira no kwishyura amafaranga ya Mobile Money.\n• Urugaga rw'Abavoka mu Rwanda: Igihe bikenewe mu gusuzuma niba umwavoka yemewe cyangwa mu gukurikirana imyitwarire ye mu mwuga.\n• Inkiko n'Inzego z'Ubutabera: Igihe gusa bitetswe n'icyemezo cy'urukiko cyangwa itegeko ryatanzwe n'inzego z'ubutabera zibifitiye ububasha mu Rwanda."
      },
      {
        title: "8. Ibanga ry'Umwuga w'Ubuvoka no Kwizerana",
        text: "Ibanga ry'umwuga w'ubuvoka (Professional Secrecy): Mu mategeko y'u Rwanda no mu mahame agenga Urugaga rw'Abavoka, amakuru n'inyandiko uhereza umwavoka mu gihe umugisha inama bigengwa n'ibanga rikomeye ry'umwuga (secret professionnel). Umwavoka ugishije inama afite inshingano ikomeye yo kutamena ibanga ku byo wamubwiye byose.\n\nIngamba z'umutekano ku rubuga: MyJudicial yubatse mu buryo bwubahiriza iri banga ry'umwuga. Inyandiko zishyirwa mu bubiko bw'ibanga (Vault) zifungwa n'ingufuri ya AES-256-GCM ku buryo n'abakozi ba MyJudicial ubwabo badashobora kuzisoma cyangwa kureba ubutumwa ugirana n'umwavoka, keretse gusa igihe habayeho ikibazo cy'ikoranabuhanga gikenera gukemurwa kandi bikagenzurwa n'amategeko, cyangwa hateganyijwe n'icyemezo cy'urukiko."
      },
      {
        title: "9. Imikoreshereze ya AI n'Umutekano wayo",
        text: "MyJudicial ikoresha ikoranabuhanga rya AI (myjudicial-ai-service) mu gufasha abaturage gusobanukirwa ibyiciro by'ibibazo byabo:\n\n• Guhindura ijwi mu nyandiko (Whisper): Iyo ufashe amajwi usobanura ikibazo cyawe, porogaramu ya Whisper ihindura iryo jwi mu magambo mu kanya gato. Iryo jwi ntiriguma ku rubuga nyuma yo kwandikwa.\n• Gutahura urwego rw'amategeko: Porogaramu yacu isesengura amagambo (Ollama Qwen2.5 cyangwa cloud yizewe) isuzuma ikibazo cyawe kugira ngo imenye niba kireba amategeko y'ubutaka, umuryango, ubucuruzi, cyangwa ibindi, ndetse ikerekana niba cyihutirwa.\n• Gushakisha umwavoka uhuye n'ikibazo: Amagambo asobanura ikibazo ahindurwamo imibare y'ikoranabuhanga (embeddings) ifasha kubona umwavoka ufite ubunararibonye mu bibazo nk'ibyo.\n• NTA MAKURU AKORESHWA MU KWIGISHA AI: Amakuru y'ibibazo byawe, inyandiko ushyiraho, amajwi wafashe, n'ibiganiro ugirana n'abavoka NTIBYIGISHWA cyangwa ngo bikoreshwe mu kunoza porogaramu za AI z'abandi.\n• Ubufasha bwo kuyobora gusa: Ibyo AI yerekana ni ibitekerezo byo kukuyobora ku mwunganizi ukwiye. AI ntabwo itanga inama z'amategeko zemewe kandi ntishobora gusimbura umwavoka wemewe n'amategeko."
      },
      {
        title: "10. Imyanzuro Yikora no Guhitamo Abavoka ku Urubuga",
        text: "NTA MYANZURO Y'AMATEGEKO IFATWA N'IKORANABUHANGA MU BURYO BWIKORA: MyJudicial ntabwo ifata imyanzuro yikora ifite ingaruka z'amategeko ku mukoresha (nk'urugero gufunga konti mu buryo bwikora cyangwa kumwima serivisi bitanyuze mu muntu).\n\nUburyo bwo gutoranya no gushyira ku murongo abavoka: Iyo ushakishije abavoka, urubuga rukoresha uburyo busobanutse bw'imibare mu kubashyira ku murongo ukurikije:\n\n1. Guhura kw'ikibazo n'ubumenyi bw'umwavoka (40%): Uko ikibazo cyawe gihuye n'ubumenyi umwavoka afite;\n2. Amanota yahawe n'abandi bakiriya (25%): Amanota umwavoka yahawe n'abamugishije inama mbere;\n3. Guhuza n'ingengo y'imari (15%): Uko ibiciro by'umwavoka bihuye n'amafaranga wifuza gukoresha;\n4. Umubare w'abatanze amanota (10%): Umubare w'abakiriya bamaze kumugisha inama bakamuha amanota;\n5. Imyaka y'ubunararibonye (5%): Igihe amaze akora umwuga w'ubuvoka mu Rugaga;\n6. Ishami ry'amategeko akoramo cyane (5%): Niba amategeko y'ikibazo ariyo asanzwe yibandaho cyane.\n\nUburenganzira bwawe bwo guhitamo: Ubu buryo bukoreshwa gusa mu kugufasha kubona abavoka ku murongo. Ufite uburenganzira bwuzuye bwo guhitamo umwavoka uwo ari we wese ushaka kuri uru rubuga."
      },
      {
        title: "11. Amakuru y'Aho Uherereye n'Ikarita",
        text: "Gushaka abavoka bakwegereye: Kugira ngo ubashe kubona abavoka bafite ibiro hafi y'aho uherereye cyangwa hafi y'urukiko rw'akarere kawe, MyJudicial ifite ikarita ikwereka aho bari. Porogaramu ukoresha igusaba uruhushya gusa igihe ukanze ahanditse gushaka abari hafi yawe.\n\nAho urubuga rufata igihe utatanze uruhushya: Iyo wanze gutanga uruhushya cyangwa telefoni yawe itabifite, ikarita ifata i Kigali rwagati (Akarere ka Nyarugenge: -1.9441, 30.0619).\n\nNta gukurikiranwa bihoraho: Amakuru y'aho uherereye akoreshwa mu gihe ushakisha gusa hakoreshejwe uburyo bwa PostGIS ST_DWithin bubara intera iri hagati yawe n'ibiro by'umwavoka. Ntabwo duhora tugukurikirana aho ugiye kandi ayo makuru ntabikwa muri konti yawe."
      },
      {
        title: "12. Porogaramu Ntoya Zifashishwa ku Urubuga (Cookies)",
        text: "Cookies z'ingenzi n'iz'urubuga: Dukoresha cookies z'ingenzi zifasha kwinjira mu buryo bwizewe no kurinda umutekano wa konti yawe (NextAuth, CSRF tokens, na Supabase auth), no gufata mu mutwe ururimi wahisemo (Icyongereza, Igifaransa, cyangwa Ikinyarwanda) hamwe n'uburyo urubuga rugaragaramo (umucyo cyangwa umwijima).\n\nNta cookies zo kwamamaza z'abandi zikoreshwa: Ntabwo dukoresha cookies z'izindi kompanyi zo gukurikirana ibyo ukora ku zindi mbuga cyangwa kwamamaza.\n\nPolitiki yihariye y'Amakuru ya Cookies: Kugira ngo umenye urutonde rwuzuye rwa cookies zikoreshwa, igihe zimaraho, n'uko wazihagarika, wasura Politiki yacu yerekeye Cookies kuri /cookies."
      },
      {
        title: "13. Igihe Amakuru Abikwa n'Uburyo Agenzurwa",
        text: "Igihe cyo kubika amakuru mu mucyo: Tubika amakuru yawe gusa mu gihe gikenewe kugira ngo dusohoze ibyo yafashwe gukora no kubahiriza amategeko y'u Rwanda:\n\n• Konti zigikora: Amakuru yawe y'umwirondoro aguma kuri konti yawe mu gihe cyose igikora kugeza igihe usabye ko ifungwa cyangwa uyisibye ubwawe.\n• Inyandiko z'imari n'ibaruramari: Inyemezabwishyu z'ubujyanama, inyandiko z'amafaranga yanyuze muri escrow, n'ibindi byerekeye amafaranga bibikwa imyaka cumi (10) hakurikijwe amategeko y'ubucuruzi n'imisoro mu Rwanda (RRA) no gukumira iyezandonke.\n• Inyandiko zo mu bubiko bw'ibanga (Vault): Inyandiko z'imanza washize mu bubiko bwite zigumamo kugeza igihe uzisibiye ubwawe cyangwa ugafunga konti yawe.\n• Raporo z'umutekano n'ibikorwa byakozwe: Raporo z'umutekano (AuditLog) zibikwa kugira ngo zifashishwe mu gucunga umutekano no gukumira ibitero by'ikoranabuhanga n'uburiganya.\n• Gahunda y'Igenzura: Dukurikije amabwiriza y'Ibiro bishinzwe Kurinda Amakuru (DPO Rwanda), MyJudicial irimo gushyiraho uburyo bwikora bwo gusiba amakuru y'igihe gito igihe cyateganyijwe n'amategeko kirangiye."
      },
      {
        title: "14. Ingamba z'Umutekano mu By'Ikoranabuhanga no mu Mikorere",
        text: "Twashyizeho ingamba zikomeye z'umutekano w'ikoranabuhanga kugira ngo amakuru yawe bwite atazimira, atakoreshwa cyangwa ngo aboneke ku batabifitiye uburenganzira:\n\n• Gufunga amakuru mu gihe ari mu nzira (TLS 1.3): Ibyohererezwa byose hagati ya telefone cyangwa mudasobwa yawe na seriveri zacu bifunze n'ingufuri ya HTTPS/TLS 1.3.\n• Gufunga inyandiko zo mu bubiko (AES-256-GCM): Inyandiko zose zishyirwa mu bubiko bwa OCI zifungwa n'ingufuri ikomeye ya AES-256-GCM hakoreshejwe imfunguzo zicungwa na OCI Key Management Service (KMS).\n• Kurinda ijambobanga: Amagambobanga afungwa n'imibare y'ikoranabuhanga ya Argon2/bcrypt; nta mukozi n'umwe ushobora kubona ijambobanga ryawe.\n• Kugenzura uburenganzira bw'abinjira (RBAC): Urubuga rwashyizweho mu buryo butandukanya Umuturage, Impuguke, n'Umuyobozi, ku buryo nta wureba amakuru atamureba.\n• Kubika raporo z'ibyabaye byose (AuditLog): Ibikorwa byose by'ingenzi (kwinjira, kwemeza ibyangombwa by'umwavoka, kureba inyandiko, gutanga amafaranga) byandikwa muri raporo z'umutekano zigaragaza igihe byakorewe n'aho byakorewe."
      },
      {
        title: "15. Kohereza Amakuru Hanze y'u Rwanda (Ingingo ya 40-42)",
        text: "Aho seriveri ziri: Kugira ngo urubuga rurusheho kugira umutekano wizewe, ubushobozi bwo kudahagarara, n'ikoranabuhanga rigezweho, MyJudicial ikoresha amasosiyete akomeye ku rwego rw'isi afite seriveri ziherereye hanze y'u Rwanda:\n\n• Ububiko bw'amakuru n'imyirondoro: Supabase / Amazon Web Services (AWS) ziri mu Muryango w'Ubumwe bw'Uburayi (EU) no muri Leta Zunze Ubumwe za Amerika (USA);\n• Ububiko bw'inyandiko zifunze (Vault): Oracle Cloud Infrastructure (OCI) iri muri USA no muri EU;\n• Amashusho yo kugisha inama: LiveKit Cloud ifite seriveri ku isi yose;\n• Kohereza imeri na SMS: Brevo ifite seriveri mu Muryango w'Ubumwe bw'Uburayi (EU);\n• Ububiko bwihuse: Upstash Redis iri muri EU no muri USA.\n\nKubahiriza Itegeko ry'u Rwanda: Dukurikije Ingingo ya 40, 41, n'iya 42 z'Itegeko nº 058/2021, kohereza amakuru hanze y'u Rwanda bikorwa hakurikijwe amasezerano akomeye yo kurinda amakuru (Data Processing Agreements), amakuru akaba afunze mu buryo bw'ikoranabuhanga (encryption), kandi bikaba ari ngombwa kugira ngo dusohoze amasezerano ya serivisi dufitanye nawe (Ingingo ya 42)."
      },
      {
        title: "16. Uburenganzira Bwawe ku Makuru Bwite (Itegeko nº 058/2021)",
        text: "Nk'uko biteganywa n'Itegeko ry'u Rwanda nº 058/2021, ufite uburenganzira bukurikira ku makuru yawe bwite:\n\n• Uburenganzira bwo kumenyeshwa (Ingingo ya 15 na 16): Kumenya mu buryo busobanutse uko amakuru yawe akusanywa n'uko akoreshwa.\n• Uburenganzira bwo kugera ku makuru (Ingingo ya 16): Gusaba kumenya amakuru tugufiteho no guhabwa kopi yayo yanditse neza.\n• Uburenganzira bwo gukosora amakuru (Ingingo ya 18): Gusaba ko amakuru atari yo cyangwa aduzuye akosorwa ako kanya. Ushobora no guhindura amakuru amwe n'amwe mu mwirondoro wawe kuri konti.\n• Uburenganzira bwo gusiba amakuru (Ingingo ya 19): Gusaba ko amakuru yawe asibwa burundu mu gihe amasezerano yarangiye cyangwa waretse gukoresha serivisi, keretse igihe amategeko y'imisoro n'ubucuruzi ategeka ko agomba kubikwa.\n• Uburenganzira bwo guhagarika by'agateganyo ikoreshwa ry'amakuru (Ingingo ya 20): Gusaba ko amakuru yawe aba ahagaritswe gukoreshwa mu gihe hari ibikigenzurwa.\n• Uburenganzira bwo kwimukana amakuru (Ingingo ya 21): Guhabwa amakuru yawe mu buryo bworoshye bwo kuyashyira ku wundi mutanga-serivisi.\n• Uburenganzira bwo kwanga ko amakuru akoreshwa (Ingingo ya 22): Kwanga ko amakuru yawe akoreshwa mu bintu bidakenewe.\n• Uburenganzira bwo kwisubiraho ku burenganzira watanze (Ingingo ya 46): Guhagarika uburenganzira wari waratanze igihe icyo ari cyo cyose.\n\nUko wakoresha uburenganzira bwawe: Ohereza ubusabe bwawe mu nyandiko ku Mukozi ushinzwe Kurinda Amakuru (DPO) kuri imeri legal@myjudicial.com. Kugira ngo turinde umutekano wawe, dushobora kugusaba kwerekana ibikuranga. Tuzakira ubusabe bwawe kandi tuguhe igisubizo mu gihe kitarenze iminsi mirongo itatu (30) iteganywa n'Itegeko nº 058/2021."
      },
      {
        title: "17. Kurinda Amakuru y'Abana (Abari Munsi y'Imyaka 18)",
        text: "Imyaka 18 yo gukoresha urubuga: Urubuga rwa MyJudicial rwateganyirijwe gusa abantu bagejeje ku myaka cumi n'umunani (18) y'amavuko bafite ubushobozi bw'amategeko bwo kugira amasezerano bakurikije amategeko y'u Rwanda.\n\nAbana bakeneye serivisi z'amategeko: Dukurikije Ingingo ya 9 y'Itegeko nº 058/2021, amakuru y'umwana ntashobora gutunganywa hatanzwe uburenganzira n'umubyeyi cyangwa umurezi we wemewe n'amategeko. Iyo hakenewe ubufasha bw'amategeko ku mwana (nk'urugero mu bibazo by'umuryango cyangwa izungura), iyo serivisi igomba gutangizwa kandi igacungwa n'umubyeyi cyangwa umwishingizi we. Iyo dusanze hari umwana wiyandikishije atabiherewe uburenganzira n'umubyeyi, konti ye ihita ifungwa n'amakuru ye agasibwa."
      },
      {
        title: "18. Ubutumwa bwa Serivisi n'Ubutumwa bwo Kumenyekanisha",
        text: "Ubutumwa bwa serivisi bwa ngombwa: Tukwoherereza ubutumwa bwa SMS na imeri bukenewe mu gutanga serivisi, nk'ubutumwa bwibutsa gahunda yo guhura n'umwavoka, imibare y'umutekano (OTP), inyemezabwishyu, n'ubutumwa bw'umutekano wa konti. Ubu butumwa ni ngombwa cyane ku mutekano no ku mikorere ya konti yawe, ku buryo utabuhagarika mu gihe ugikoresha urubuga.\n\nUbutumwa bwo kumenyekanisha ibikorwa bishya: Iyo dushaka kukwoherereza inyandiko zigisha amategeko cyangwa amakuru y'ibikorwa bishya, tubanza kugusaba uburenganzira. Buri butumwa bufite ahanditse gukuramo izina ryawe (unsubscribe) kugira ngo uhagarike kububona igihe cyose ubyifuje."
      },
      {
        title: "19. Izindi Mbuga n'Amasosiyete Dukorana",
        text: "Imbuga z'abandi ziriho links: Urubuga rwa MyJudicial rushobora gushyiraho links zikwerekeza ku zindi mbuga z'abafatanyabikorwa, nk'Urugaga rw'Abavoka mu Rwanda (rwanda-bar.org), imbuga z'inkiko z'u Rwanda, cyangwa imbuga z'ibigo by'ubwishyu.\n\nKwigenga kw'izo mbuga: MyJudicial nta bubasha ifite ku mikorere y'izo mbuga z'abandi cyangwa uburyo zicungamo amakuru yazo. Iyo ukanze kuri izo links uba ugiye ku yindi mbuga, bityo turakugira inama yo gusoma amabwiriza yazo y'ibanga."
      },
      {
        title: "20. Gukemura Ibibazo by'Umutekano no Kumenyesha Abagize Ikibazo",
        text: "Guhangana n'ibitero by'umutekano: MyJudicial ifite amabwiriza asobanutse agenga uburyo bwo gutahura no gukemura vuba ikibazo icyo ari cyo cyose cy'umutekano w'amakuru.\n\nKumenyesha inzego z'ubutabera mu masaha 48: Hakurikijwe Ingingo ya 43 y'Itegeko nº 058/2021, igihe habayeho ikibazo cy'itakara cyangwa ivumburwa ry'amakuru bwite, MyJudicial izabimenyesha Ikigo cy'Igihugu gishinzwe Umutekano w'Ikoranabuhanga / Ibiro bishinzwe Kurinda Amakuru (NCSA DPO) mu masaha adarenga mirongo ine n'umunani (48) bimenyekanye.\n\nKumenyesha abaturage bagize ikibazo: Hakurikijwe Ingingo ya 44 y'iryo tegeko, niba icyo kibazo gishobora guteza inkurikizi mbi ku burenganzira bwawe, tuzahita tukubimenyesha vuba bishoboka tukanakwereka ingamba zafashwe zo kugikemura n'icyo wakora ngo wikingire."
      },
      {
        title: "21. Kugeza Ikirego mu Nzego Zibifitiye Ububasha (NCSA / DPO Rwanda)",
        text: "Kubanza kutumenyesha: Icyo ari cyo cyose utishimiye ku micungire y'amakuru yawe, turakugira inama yo kubanza kutwandikira kuri imeri y'Ushinzwe Kurinda Amakuru (DPO) kuri legal@myjudicial.com.\n\nUburenganzira bwo gutanga ikirego mu buyobozi: Ufite uburenganzira buteganywa n'Itegeko nº 058/2021 bwo kugeza ikirego mu Kigo cy'Igihugu gishinzwe gukurikirana iby'ikoranabuhanga no kurinda amakuru bwite mu Rwanda:\n\nNational Cyber Security Authority (NCSA)\nData Protection Office (DPO)\nUrubuga rwa interineti: https://dpo.gov.rw\nImeri: dpo@ncsa.gov.rw\nAho giherereye: Kigali, Repubulika y'u Rwanda"
      },
      {
        title: "22. Ivugururwa ry'Iyi Politiki n'Ibyahindutse",
        text: "Ivugururwa rihoraho: Dushobora kuvugurura iyi Politiki y'Ibanga igihe hari ibyahindutse mu ikoranabuhanga, mu mikorere y'urubuga, cyangwa mu mabwiriza atangwa n'Ibiro bishinzwe Kurinda Amakuru.\n\nItariki yo kuvugurura: Itariki igaragara hejuru ku rupapuro yerekana igihe aya mabwiriza aherukira kuvugururwa no gutangira gukurikizwa.\n\nKumenyesha impinduka zikomeye: Iyo habayeho impinduka zikomeye zireba uburenganzira bwawe, tuzakubimenyesha binyuze mu butumwa bwo ku rubuga cyangwa kuri imeri yawe mbere y'uko izo mpinduka zitangira gukurikizwa. Inyandiko z'ubushize zibikwa mu buryo bw'ikoranabuhanga kandi ushobora kuzisaba ukazihabwa."
      },
      {
        title: "23. Tuvugishe n'Umukozi Ushinzwe Kurinda Amakuru (DPO)",
        text: "Ku bibazo byose byerekeye iyi Politiki y'Ibanga cyangwa gukoresha uburenganzira bwawe buteganywa n'Itegeko nº 058/2021, watwandikira ukoresheje imyirondoro ikurikira:\n\n• Ushinzwe kugenzura amakuru: MyJudicial Ltd\n• Imeri y'Ushinzwe Kurinda Amakuru (DPO): legal@myjudicial.com\n• Imeri y'Ubufasha bwa tekiniki: support@myjudicial.com\n• Telefoni ngendanwa: +250 788 312 456\n• Ibiro biherereye: Centenary House, Etaji ya 4, KN 3 Ave & KN 4 St, Nyarugenge, Kigali, Rwanda\n• Agasanduku k'iposita: P.O. Box 2848, Kigali, Rwanda\n• Amasaha yo gukora: Kuwa Mbere – Kuwa Gatanu: 8:00 AM – 6:00 PM CAT"
      }
    ]
  }
};

// 1. Update en.json
const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));
enJson.legalPages = enJson.legalPages || {};
enJson.legalPages.privacy = privacyEn;
fs.writeFileSync(enJsonPath, JSON.stringify(enJson, null, 2) + '\n', 'utf8');
console.log('Updated en.json');

// 2. Update en/legalPages.json if it exists
if (fs.existsSync(enLegalPagesPath)) {
  const enLegalPages = JSON.parse(fs.readFileSync(enLegalPagesPath, 'utf8'));
  enLegalPages.privacy = privacyEn;
  fs.writeFileSync(enLegalPagesPath, JSON.stringify(enLegalPages, null, 2) + '\n', 'utf8');
  console.log('Updated en/legalPages.json');
}

// 3. Update fr.json
const frJson = JSON.parse(fs.readFileSync(frJsonPath, 'utf8'));
frJson.legalPages = frJson.legalPages || {};
frJson.legalPages.privacy = privacyFr;
fs.writeFileSync(frJsonPath, JSON.stringify(frJson, null, 2) + '\n', 'utf8');
console.log('Updated fr.json');

// 4. Update rw.json
const rwJson = JSON.parse(fs.readFileSync(rwJsonPath, 'utf8'));
rwJson.legalPages = rwJson.legalPages || {};
rwJson.legalPages.privacy = privacyRw;
fs.writeFileSync(rwJsonPath, JSON.stringify(rwJson, null, 2) + '\n', 'utf8');
console.log('Updated rw.json');

// 5. Update backend prisma/content-pages-seed-data.ts
// Format sections into CMS blocks:
function buildCmsBlocks(sections) {
  return sections.map((sec, idx) => ({
    id: `sec-${idx + 1}`,
    type: "prose",
    heading: sec.title,
    body: sec.text
  }));
}

const seedRaw = fs.readFileSync(seedDataPath, 'utf8');
// Parse CONTENT_PAGES_SEED
// We will replace the PRIVACY records in the seed array
const seedMatch = seedRaw.match(/export const CONTENT_PAGES_SEED = (\[[\s\S]*\]);\s*$/);
if (seedMatch) {
  const seedArray = JSON.parse(seedMatch[1]);
  for (const page of seedArray) {
    if (page.slug === 'PRIVACY') {
      if (page.locale === 'en') {
        page.title = privacyEn.hero.title;
        page.effectiveDate = "September 2026";
        page.metaTitle = privacyEn.meta.title;
        page.metaDescription = privacyEn.meta.description;
        page.blocks = buildCmsBlocks(privacyEn.content.sections);
      } else if (page.locale === 'fr') {
        page.title = privacyFr.hero.title;
        page.effectiveDate = "Septembre 2026";
        page.metaTitle = privacyFr.meta.title;
        page.metaDescription = privacyFr.meta.description;
        page.blocks = buildCmsBlocks(privacyFr.content.sections);
      } else if (page.locale === 'rw') {
        page.title = privacyRw.hero.title;
        page.effectiveDate = "Nzeri 2026";
        page.metaTitle = privacyRw.meta.title;
        page.metaDescription = privacyRw.meta.description;
        page.blocks = buildCmsBlocks(privacyRw.content.sections);
      }
    }
  }

  const updatedTs = `/**
 * Generated CMS content-page seed data.
 * Source of truth: myJudicial-frontend/messages/{en,fr,rw}.json (about, careersPage, legalPages, contactPage).
 */
export const CONTENT_PAGES_SEED = ${JSON.stringify(seedArray, null, 2)};\n`;

  fs.writeFileSync(seedDataPath, updatedTs, 'utf8');
  console.log('Updated content-pages-seed-data.ts');
} else {
  console.error('Could not match CONTENT_PAGES_SEED in seed file');
}

console.log('All privacy content updated successfully!');
