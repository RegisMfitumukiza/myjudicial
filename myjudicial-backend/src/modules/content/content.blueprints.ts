/**
 * Generated CMS content-page seed data.
 * Source of truth: myJudicial-frontend/messages/{en,fr,rw}.json (about, careersPage, legalPages, contactPage).
 */
export const CONTENT_PAGES_SEED = [
  {
    "slug": "TERMS",
    "title": "Terms of Service",
    "blocks": [
      {
        "id": "sec-1",
        "type": "prose",
        "body": "By accessing or using the Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, do not use the Services.",
        "heading": "1. Acceptance of Terms"
      },
      {
        "id": "sec-2",
        "type": "prose",
        "body": "To access certain features of the Services, you must create an account. You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must be at least 18 years old to create an account.",
        "heading": "2. User Accounts"
      },
      {
        "id": "sec-3",
        "type": "prose",
        "body": "MyJudicial is a marketplace connecting clients with legal professionals. We do not provide legal advice ourselves. When you book a consultation, payment is held in our secure escrow system and released to the lawyer only upon successful completion of the consultation.",
        "heading": "3. Marketplace and Escrow"
      },
      {
        "id": "sec-4",
        "type": "prose",
        "body": "The Services are provided 'AS IS' and 'AS AVAILABLE'. We disclaim all warranties, express or implied, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.",
        "heading": "4. Disclaimers"
      }
    ],
    "status": "published",
    "locale": "en"
  },
  {
    "slug": "PRIVACY",
    "title": "Privacy Policy",
    "blocks": [
      {
        "id": "sec-1",
        "type": "prose",
        "heading": "1. Who We Are & Controller Identity",
        "body": "MyJudicial Ltd (\"MyJudicial\", \"we\", \"our\", or \"us\") operates the premier digital legal-services platform in Rwanda, connecting citizens, entrepreneurs, and institutions with verified, certified advocates and legal professionals. For the purposes of Law No. 058/2021 relating to the protection of personal data and privacy, MyJudicial is the Data Controller responsible for personal data processed through our website (myjudicial.com) and associated marketplace services.\n\nOur registered headquarters are located at Centenary House, 4th Floor, KN 3 Ave & KN 4 St, Nyarugenge Central Business District, P.O. Box 2848, Kigali, Rwanda. We have designated a Data Protection Officer (DPO) who can be contacted directly at legal@myjudicial.com for any statutory privacy requests or regulatory compliance inquiries."
      },
      {
        "id": "sec-2",
        "type": "prose",
        "heading": "2. Scope of Services & Application",
        "body": "This Privacy Policy governs the collection, processing, and protection of personal data across all services offered by MyJudicial, including:\n\n• Citizen and business client directory browsing, legal search, and map-based advocate discovery;\n• Client intake wizard and AI-assisted case triage;\n• Appointment scheduling, consultation management, and LiveKit encrypted video conferencing;\n• Secure escrow custody for consultation fee deposits and releases;\n• Encrypted document storage in the MyJudicial legal vault (OCI Object Storage);\n• Verified advocate profile hosting, onboarding, and compliance credentialing.\n\nScope Boundary: This policy applies strictly to the technical platform and infrastructure managed by MyJudicial. When you retain an advocate for legal representation in court or formal legal advisory, that advocate acts as an independent professional bound by statutory legal professional privilege, the Rwanda Bar Association Code of Conduct, and their own professional secrecy duties."
      },
      {
        "id": "sec-3",
        "type": "prose",
        "heading": "3. Information We Collect",
        "body": "We collect only personal data necessary to provide our digital legal marketplace services. We categorize collected information into the following categories:\n\n• Account & Authentication Data: Full legal name, email address, telephone number, one-way hashed passwords (Argon2/bcrypt), federated OAuth account IDs (Google, LinkedIn), preferred language, and account role (Citizen, Expert, Admin).\n• Advocate & Legal Expert Professional Data: Display name, professional biography, law firm affiliation, physical office address, Rwanda Bar Association (RBA) roll number, active practicing certificate, national ID/passport copy, academic diplomas, verified legal specialties, consultation fee rates, and Mobile Money payout phone numbers.\n• Consultation & Booking Records: Selected legal service category, consultation delivery mode (video, phone, in-person), appointment date and duration, client intake summary notes, meeting room identifiers, and reschedule/cancellation history.\n• In-Platform Communications: Direct messages exchanged between clients and legal advocates, file attachments (PDFs, court notices, contracts), and message delivery timestamps.\n• Legal Vault Documents: Confidential case files, contracts, pleadings, deeds, and identification documents uploaded to the user vault. Files are encrypted client-side using AES-256-GCM before storage in OCI Object Storage.\n• Financial & Escrow Records: Mobile Money transaction references (MTN Mobile Money, Airtel Money), AzamPay gateway transaction identifiers, platform commission calculations, escrow deposit and payout ledger records. MyJudicial does NOT store debit/credit card numbers or Mobile Money PINs.\n• AI Triage Inquiries: Case descriptions submitted in text or voice audio, in-memory transcriptions, detected legal specialties, urgency assessments, and estimated budget parameters.\n• Location Data: Geolocation coordinates provided on-demand for map discovery (defaults to Kigali Central Business District: -1.9441, 30.0619); advocate office coordinates.\n• Technical & Audit Logs: IP addresses, browser user agent strings, login records, and immutable audit logs (AuditLog) tracking sensitive platform events."
      },
      {
        "id": "sec-4",
        "type": "prose",
        "heading": "4. How We Collect Your Information",
        "body": "We collect personal data through transparent, direct, and automated mechanisms:\n\n• Directly Provided by You: When creating an account, filling out profile fields, submitting intake forms, uploading documents to the vault, exchanging messages, or paying consultation fees.\n• Automated Interactions: During your navigation of the platform, essential cookies, device attributes, IP addresses, and diagnostic error telemetry are automatically recorded to ensure system integrity and security.\n• Legal Expert Submissions: When advocates apply to join MyJudicial, submitting professional credentials, Bar certificates, identification, and schedule rules.\n• Official Verification Cross-Checks: To ensure trust and consumer protection, our compliance team cross-checks submitted credentials directly against the public Roll of Advocates maintained by the Rwanda Bar Association."
      },
      {
        "id": "sec-5",
        "type": "prose",
        "heading": "5. Purposes & How We Use Your Data",
        "body": "MyJudicial processes personal data exclusively for the following specified, legitimate purposes:\n\n• Marketplace Operation & Account Management: Administering user registrations, authentication, role authorization, and user profile management.\n• Advocate Verification & Fraud Prevention: Verifying advocate Bar standing, preventing unauthorized representation, and safeguarding consumer trust.\n• Booking & Virtual Consultations: Facilitating appointment scheduling, calendar synchronization, and establishing secure WebRTC video rooms via LiveKit.\n• Escrow & Financial Settlement: Holding consultation fee deposits in escrow custody and executing disbursements to legal experts upon verified consultation delivery.\n• Encrypted Document Vault Services: Providing high-security, client-side encrypted cloud storage for legal documentation and case evidence.\n• AI-Assisted Intake Triage & Case Classification: Providing automated legal subject-matter classification, urgency assessment, and lawyer matchmaking based on public practice areas.\n• Operational Notifications & Service Messaging: Dispatching appointment reminders, authentication OTPs, payment confirmations, and system notifications via Brevo (SMS and email).\n• Platform Security, Auditing & Legal Compliance: Detecting cyber threats, investigating disputes, maintaining immutable audit trails, and satisfying statutory tax and regulatory reporting obligations under Rwandan law."
      },
      {
        "id": "sec-6",
        "type": "prose",
        "heading": "6. Legal Basis for Processing (Law No. 058/2021)",
        "body": "Pursuant to Article 46 of Rwanda Law No. 058/2021 relating to the protection of personal data and privacy, MyJudicial processes your personal data under the following lawful bases:\n\n• Performance of a Contract (Article 46(1)(b)): Processing is necessary for the conclusion and performance of the contract between you and MyJudicial (terms of service, booking management, escrow fee custody, document storage, and account access).\n• Compliance with a Legal Obligation (Article 46(1)(c)): Processing is necessary to satisfy statutory obligations under Rwandan commercial law, financial record-keeping, anti-money laundering regulations, tax filings with the Rwanda Revenue Authority (RRA), and lawful judicial summonses.\n• Legitimate Interests (Article 46(1)(f)): Processing is necessary for the legitimate business interests of MyJudicial and its users—specifically verifying advocate credentials on the Bar Roll, preventing fraud and unauthorized practice of law, protecting infrastructure security, and maintaining immutable audit trails—provided these interests do not override your fundamental rights.\n• Explicit Consent (Article 46(1)(a)): Where applicable, we rely on your specific, informed consent for optional features, including granting device geolocation for interactive map search and uploading voice audio recordings for AI transcription. Consent may be revoked at any time."
      },
      {
        "id": "sec-7",
        "type": "prose",
        "heading": "7. How We Share Information & Recipients",
        "body": "We do not sell, rent, or monetize your personal data. We disclose personal information solely to the following defined categories of recipients:\n\n• Designated Legal Experts: When you initiate an intake inquiry or confirm a consultation booking, your contact information, issue description, and shared documents are provided directly to that advocate.\n• Core Cloud & Hosting Providers:\n  - Database & Identity Hosting: Supabase / Amazon Web Services (AWS) data centers.\n  - Encrypted Document Vault: Oracle Cloud Infrastructure (OCI) Object Storage with Key Management Service (KMS) envelope encryption.\n  - Real-Time Virtual Consultations: LiveKit Cloud infrastructure for encrypted WebRTC video rooms.\n  - Transactional Communications: Brevo (formerly Sendinblue) for transactional email, booking alerts, and SMS dispatch.\n  - In-Memory Caching & Session Rate-Limiting: Upstash Redis.\n  - Payment Gateway & Escrow Aggregation: AzamPay for Mobile Money checkout and automated advocate disbursements.\n• Rwanda Bar Association & Regulatory Bodies: In instances of professional misconduct inquiries or credential cross-referencing.\n• Judicial Authorities & Law Enforcement: Where strictly mandated under a legally binding court order, subpoena, or statutory warrant issued by a competent Rwandan judicial authority."
      },
      {
        "id": "sec-8",
        "type": "prose",
        "heading": "8. Client-Lawyer Confidentiality & Legal Privilege",
        "body": "Legal Professional Privilege: Under Rwandan law and the statutory regulations of the Rwanda Bar Association, legal counsel consultations and case materials enjoy statutory professional secrecy (secret professionnel). The advocate you consult is legally bound to preserve the confidentiality of all information disclosed in contemplation of legal representation.\n\nTechnical Platform Safeguards: MyJudicial is engineered to uphold this sacred duty. Documents uploaded to the legal vault are encrypted client-side using AES-256-GCM. MyJudicial personnel, support teams, and third-party vendors do not possess access to decrypt or review confidential client-advocate communications or case evidence, except where strictly required for authorized administrative maintenance under audited conditions or when compelled by a valid Rwandan court order."
      },
      {
        "id": "sec-9",
        "type": "prose",
        "heading": "9. AI-Assisted Features & Machine Learning Transparency",
        "body": "MyJudicial incorporates modern artificial intelligence features through our microservice (myjudicial-ai-service) to streamline case triage and intake:\n\n• Voice Transcription (Whisper): When you record an audio intake note, our local Whisper speech recognition model transcribes the speech to text in-memory. Audio streams are not retained after transcription completes.\n• Case Subject-Matter Classification: Our language model (self-hosted Ollama with Qwen2.5 or dedicated enterprise cloud inference) analyzes the factual description of your inquiry to identify primary legal areas (such as Land Law, Family Law, or Commercial Law) and evaluate urgency indicators.\n• Semantic Vector Search: The inquiry text is converted into mathematical vector embeddings (using sentence-transformers all-MiniLM-L6-v2) to match matters against published advocate experience.\n• ABSOLUTELY NO MODEL TRAINING: Personal case descriptions, uploaded documents, voice recordings, and consultation data are NEVER used to train, retrain, or improve public or proprietary foundation models.\n• Informational Nature: AI triage suggestions are strictly informational tools designed to assist you in navigating the legal marketplace. The AI does NOT provide legal advice, does not draft binding pleadings without advocate review, and never substitutes for a licensed human lawyer."
      },
      {
        "id": "sec-10",
        "type": "prose",
        "heading": "10. Automated Decision-Making & Recommendation Ranking",
        "body": "NO Automated Legal Decisions: MyJudicial does NOT subject users to automated decision-making processes that produce legal effects or similarly significant consequences (such as automated rejection of service, automated account termination, or automated fee liability).\n\nTransparent Multi-Factor Ranking Logic: When clients search for legal experts, our recommendation engine orders search results using an objective, multi-factor algorithm based on:\n\n1. Semantic Relevance (40%): Alignment between the user's matter description and the advocate's verified practice profile;\n2. Advocate Rating (25%): Historical review ratings submitted by verified clients from completed consultations;\n3. Budget Fit (15%): Comparison between the advocate's published flat consultation rate and the client's declared budget;\n4. Verified Review Volume (10%): Total number of completed client reviews;\n5. Professional Experience (5%): Documented years of practice since Bar admission;\n6. Specialty Match (5%): Direct alignment with the advocate's designated primary legal specialty.\n\nUser Autonomy: This ranking score is purely a sorting mechanism for discoverability. Clients retain complete discretion to filter, compare, and select any registered advocate regardless of ranking order."
      },
      {
        "id": "sec-11",
        "type": "prose",
        "heading": "11. Location Data & Geospatial Search",
        "body": "On-Demand Geolocation: To assist citizens in discovering legal advocates with physical chambers in their vicinity or jurisdiction, MyJudicial offers an interactive map feature. Your browser requests location permission strictly when you click to discover nearby advocates.\n\nDefault & Fallback Coordinates: If you decline permission or if your device does not support geolocation, the platform defaults to the central business coordinates of Kigali (Nyarugenge District: -1.9441, 30.0619).\n\nNo Background Tracking: Client geographic coordinates are transmitted temporarily to execute a radius distance query against advocate office coordinates (using PostGIS ST_DWithin geospatial functions). Client coordinates are never tracked in the background and are never stored in user account records or profile tables."
      },
      {
        "id": "sec-12",
        "type": "prose",
        "heading": "12. Cookies & Similar Technologies",
        "body": "Session & Functional Cookies: We utilize strictly necessary cookies to maintain secure authentication sessions (NextAuth session tokens, CSRF tokens, and Supabase auth keys) and remember interface preferences (such as your chosen language: English, French, Kinyarwanda; and theme: light or dark mode).\n\nNo Third-Party Ad Trackers: We do not deploy third-party advertising or cross-site tracking cookies.\n\nDedicated Cookie Policy: For a complete inventory of cookie names, storage lifespans, purposes, and browser control settings, please review our standalone Cookie Policy at /cookies."
      },
      {
        "id": "sec-13",
        "type": "prose",
        "heading": "13. Data Retention & Archival Governance",
        "body": "Transparent Data Lifecycle: We retain your personal data strictly for as long as necessary to fulfill the purposes for which it was collected and to satisfy statutory requirements under Rwandan law:\n\n• Active User Accounts: Identity and account credentials remain active until you delete your account or request account closure.\n• Statutory Accounting & Financial Ledgers: Consultation fee transactions, escrow settlement logs, and billing invoices are retained for ten (10) years in compliance with Rwandan tax laws, commercial code regulations, and anti-money laundering requirements.\n• Legal Vault Documents: Uploaded case documents remain stored in your private vault until you delete them or close your account.\n• Security & System Audit Logs: Audit trails (AuditLog) are maintained for security analysis, forensic investigation, and fraud prevention.\n• Data Governance Roadmap: In accordance with supervisory guidance from the Data Protection Office (DPO Rwanda), MyJudicial is actively codifying automated data lifecycle purging jobs to systematically delete staging records upon statutory expiry."
      },
      {
        "id": "sec-14",
        "type": "prose",
        "heading": "14. Technical & Organizational Security Controls",
        "body": "We implement defense-in-depth security measures to protect your personal data against accidental loss, unauthorized access, alteration, or disclosure:\n\n• Encryption in Transit: All communications between your device and our servers are encrypted using Transport Layer Security (TLS 1.3 / HTTPS).\n• Encryption at Rest & Vault Security: Sensitive documents stored in Oracle Cloud Infrastructure (OCI) Object Storage are protected by client-side AES-256-GCM encryption with envelope keys managed via OCI Key Management Service (KMS).\n• Password Hashing: User passwords are protected using salted, cryptographic one-way hashes (Argon2/bcrypt); plaintext passwords are never recorded.\n• Role-Based Access Controls (RBAC): Strict permission boundaries separate Citizen, Expert, and Administrator capabilities, ensuring platform personnel cannot access confidential user data without specific operational justification.\n• Immutable Audit Logging: Security-critical actions (authentication, credential verification, file access, escrow releases) are permanently logged to dedicated audit tables with IP addresses and timestamps."
      },
      {
        "id": "sec-15",
        "type": "prose",
        "heading": "15. International Data Transfers (Articles 40-42)",
        "body": "Infrastructure Location: To guarantee enterprise resilience, fault tolerance, and scalable performance, MyJudicial utilizes reputable global cloud providers whose server infrastructure is situated outside the Republic of Rwanda:\n\n• Core Database & Authentication: Supabase / Amazon Web Services (AWS) data centers located in the European Union and the United States;\n• Encrypted Document Vault: Oracle Cloud Infrastructure (OCI) Object Storage facilities located in the United States and the European Union;\n• Video Consultation Streaming: LiveKit Cloud infrastructure operating across global edge facilities;\n• Transactional Email & SMS Delivery: Brevo data centers located in the European Union;\n• Cache Storage: Upstash Redis clusters located in the European Union and the United States.\n\nStatutory Compliance: In accordance with Articles 40, 41, and 42 of Rwanda Law No. 058/2021, transfers of personal data outside Rwanda are conducted under robust legal safeguards, including comprehensive Data Processing Agreements (DPAs) with standard contractual clauses, state-of-the-art encryption at rest and in transit, and the necessity of transfer for the performance of our contract with you (Article 42)."
      },
      {
        "id": "sec-16",
        "type": "prose",
        "heading": "16. Your Privacy Rights Under Rwanda Law No. 058/2021",
        "body": "As a data subject under Law No. 058/2021, you are entitled to the following statutory rights regarding your personal information:\n\n• Right to be Informed (Articles 15 & 16): Right to receive clear, concise, and transparent information regarding how your data is processed.\n• Right of Access (Article 16): Right to obtain confirmation of whether we hold personal data concerning you and to receive a structured copy of that data.\n• Right to Rectification (Article 18): Right to request the immediate correction of inaccurate or incomplete personal data. You may also update your account details directly in Profile Settings.\n• Right to Erasure / Deletion (Article 19): Right to request the permanent erasure of your personal data where it is no longer required for the purposes collected or where you withdraw consent, subject to statutory retention obligations under Rwandan tax and commercial laws.\n• Right to Restriction of Processing (Article 20): Right to obtain restriction of processing during verification of data accuracy or lawful processing disputes.\n• Right to Data Portability (Article 21): Right to receive your personal data in a structured, commonly used, machine-readable format.\n• Right to Object (Article 22): Right to object to processing founded on legitimate interests or direct informational communications.\n• Right to Withdraw Consent (Article 46): Where processing is based on consent, you may withdraw consent at any time without retroactive impact.\n\nHow to Exercise Your Rights: Submit your request in writing to our Data Protection Officer at legal@myjudicial.com. To safeguard your identity, we may require identity verification prior to acting on your request. We will acknowledge receipt promptly and provide a substantive response within the statutory thirty (30) day timeframe prescribed by Law No. 058/2021."
      },
      {
        "id": "sec-17",
        "type": "prose",
        "heading": "17. Children's Privacy (Under 18)",
        "body": "Eighteen (18) Age Requirement: The MyJudicial marketplace is strictly intended for individuals who are at least eighteen (18) years of age and possess full legal capacity to enter into binding legal agreements under the laws of Rwanda.\n\nMinors Requiring Legal Services: Pursuant to Article 9 of Law No. 058/2021, personal data of a child can only be processed with the verified consent of a parent or legal guardian. If legal counsel is sought on behalf of a child or minor (e.g. in family matters, inheritance, or protection cases), the consultation must be initiated, authorized, and managed by their lawful parent or legal guardian. If we discover an unsupervised account registered by a child under 18, we will immediately terminate the account and purge the corresponding data."
      },
      {
        "id": "sec-18",
        "type": "prose",
        "heading": "18. Service Communications & Marketing Preferences",
        "body": "Transactional Messages: We transmit essential operational communications by SMS and email, including appointment reminders, security OTP verification codes, booking confirmations, escrow release notifications, and critical platform security notices. These communications are integral to service fulfillment and account security, and users cannot opt out of transactional notices while their account remains active.\n\nMarketing & Educational Communications: If MyJudicial provides optional informational legal guides, quarterly legal insights, or platform feature announcements, you will be given a clear choice to opt in. Every marketing message contains an immediate unsubscribe link allowing you to opt out at any time without affecting your operational platform access."
      },
      {
        "id": "sec-19",
        "type": "prose",
        "heading": "19. Third-Party Websites & Integrations",
        "body": "External Platform Boundaries: The MyJudicial website may feature links to external third-party platforms, such as the Rwanda Bar Association (rwanda-bar.org), government portals, judicial dockets, or payment provider authentication gateways.\n\nIndependent Privacy Policies: MyJudicial does not exercise control over the information practices or policies of external websites. Following links to third-party domains is conducted at your own discretion, and we strongly encourage you to review the privacy notices of any external site you visit."
      },
      {
        "id": "sec-20",
        "type": "prose",
        "heading": "20. Data Breach Response & Statutory Notification",
        "body": "Incident Management Protocol: MyJudicial maintains a documented incident response procedure to swiftly detect, isolate, and remediate suspected personal data breaches or unauthorized access events.\n\n48-Hour Supervisory Notification: In compliance with Article 43 of Rwanda Law No. 058/2021, where an incident constitutes a personal data breach, MyJudicial will notify the National Cyber Security Authority / Data Protection Office (NCSA DPO) within forty-eight (48) hours of becoming aware of the breach.\n\nData Subject Notification: In accordance with Article 44 of Law No. 058/2021, if the breach is likely to result in a high risk to your rights, freedoms, or financial security, we will notify you without undue delay, detailing the nature of the breach, the potential consequences, and the remedial actions taken to safeguard your data."
      },
      {
        "id": "sec-21",
        "type": "prose",
        "heading": "21. Supervisory Authority Complaints (NCSA / DPO Rwanda)",
        "body": "Internal Escalation: If you have questions or concerns regarding our privacy practices, we invite you to contact our Data Protection Officer first at legal@myjudicial.com.\n\nStatutory Right to Complain: You have the statutory right under Law No. 058/2021 to lodge a formal complaint with Rwanda's designated supervisory authority for data protection:\n\nNational Cyber Security Authority (NCSA)\nData Protection Office (DPO)\nOfficial Web Portal: https://dpo.gov.rw\nOfficial Email: dpo@ncsa.gov.rw\nPhysical Location: Kigali, Republic of Rwanda"
      },
      {
        "id": "sec-22",
        "type": "prose",
        "heading": "22. Policy Updates & Versioning",
        "body": "Periodic Revision: We may update this Privacy Policy periodically to reflect technological enhancements, operational changes, or revised supervisory guidance from the Data Protection Office.\n\nEffective Date & Last Updated: The effective date at the top of this document indicates when the current version was promulgated.\n\nNotification of Material Modifications: When material changes are made that substantially impact your rights or data governance standards, we will provide advance notification via prominent banners across the platform or direct email communication. Previous revisions are archived in our content management system and remain accessible upon request to our privacy team."
      },
      {
        "id": "sec-23",
        "type": "prose",
        "heading": "23. Contact Us & Data Protection Officer",
        "body": "For any inquiries regarding this Privacy Policy, your personal data, or the exercise of your statutory rights under Law No. 058/2021, please reach out to our privacy office:\n\n• Data Controller: MyJudicial Ltd\n• Data Protection Officer (DPO) Email: legal@myjudicial.com\n• Customer Support Email: support@myjudicial.com\n• Telephone Hotline: +250 788 312 456\n• Physical Address: Centenary House, 4th Floor, KN 3 Ave & KN 4 St, Nyarugenge Central Business District, Kigali, Rwanda\n• Postal Address: P.O. Box 2848, Kigali, Rwanda\n• Business Hours: Monday – Friday: 8:00 AM – 6:00 PM CAT"
      }
    ],
    "status": "published",
    "locale": "en",
    "effectiveDate": "September 2026",
    "metaTitle": "Privacy Policy | MyJudicial",
    "metaDescription": "Learn how MyJudicial protects your personal data under Rwanda Law No. 058/2021 on Personal Data Protection and Privacy."
  },
  {
  "slug": "COOKIES",
  "title": "Cookie Policy",
  "blocks": [
    {
      "id": "sec-1",
      "type": "prose",
      "heading": "1. Introduction & Statutory Scope",
      "body": "MyJudicial Ltd (\"MyJudicial\", \"we\", \"our\", or \"us\") operates Rwanda's premier digital legal-services marketplace, connecting citizens, entrepreneurs, and institutions with certified, verified legal advocates.\n\nThis Cookie Policy explains how and why we utilize HTTP cookies, browser local storage (localStorage), session storage (sessionStorage), and similar web technologies when you visit our website (myjudicial.com) or access our platform services. This policy is established in full compliance with Law No. 058/2021 relating to the protection of personal data and privacy.\n\nScope Boundary: This document specifically addresses browser storage and client-side device identifiers. For comprehensive details regarding how we collect, process, safeguard, and retain personal information across our broader legal infrastructure, please refer to our full Privacy Policy."
    },
    {
      "id": "sec-2",
      "type": "prose",
      "heading": "2. What Are Cookies & Browser Storage Technologies?",
      "body": "Web applications use several standardized browser storage mechanisms to operate securely and reliably:\n\n• HTTP Cookies: Small alphanumeric text files saved on your computer, tablet, or smartphone by a web server. When you navigate between pages or return on a subsequent visit, your browser transmits these cookies back to our domain so that our system can authenticate your identity and maintain security.\n• HTML5 Local Storage (localStorage): A client-side key-value storage mechanism embedded in modern browsers. LocalStorage retains specific user preferences—such as your chosen visual theme or language—locally on your device without transmitting data in HTTP request headers.\n• HTML5 Session Storage (sessionStorage): A transient storage repository restricted strictly to the lifespan of an active browser tab. All sessionStorage items are instantly wiped when you close the tab or browser window."
    },
    {
      "id": "sec-3",
      "type": "prose",
      "heading": "3. Our Core Privacy Commitment: Zero Third-Party Tracking",
      "body": "Unlike conventional consumer platforms, MyJudicial is designed from the ground up for strict confidentiality and legal professional integrity:\n\n• NO Third-Party Behavioral Tracking: We do not deploy Google Analytics, Meta Pixel, tracking beacons, or cross-site tracking scripts. Your browsing and inquiry history is never monitored across the web.\n• NO Advertising or Marketing Cookies: We do not permit ad networks, data brokers, or commercial marketing partners to place cookies on your device. We do not sell or monetize user data.\n• Privacy by Design: We intentionally engineer all marketplace features—including interactive map discovery and virtual video consultations—using open-source and privacy-preserving infrastructure that requires no third-party profiling."
    },
    {
      "id": "sec-4",
      "type": "prose",
      "heading": "4. Categories of Technologies We Use",
      "body": "MyJudicial relies exclusively on three transparent, necessary categories of web technologies:\n\n• Strictly Necessary Technologies: Essential for the core operation, identity authentication, and cybersecurity of the platform. Without these technologies, user login, encrypted account sessions, and secure consultation bookings cannot function.\n• Preference & Localization Technologies: Enable the platform to remember your deliberate user choices—such as your preferred language (English, French, or Kinyarwanda), color theme mode (Light, Dark, or System), and appointment scheduling timezone.\n• Functional & Session State Technologies: Temporarily safeguard your navigation state—such as whether the dashboard sidebar is open or auto-saving multi-step onboarding wizard entries to prevent accidental data loss."
    },
    {
      "id": "sec-5-intro",
      "type": "prose",
      "heading": "5. Comprehensive HTTP Cookie Inventory",
      "body": "The following table documents all first-party HTTP cookies generated by the MyJudicial platform:"
    },
    {
      "id": "sec-5-table",
      "type": "table",
      "columns": [
        "Cookie Name",
        "Category",
        "Provider",
        "Storage Type",
        "Duration",
        "Purpose"
      ],
      "rows": [
        [
          "authjs.session-token",
          "Strictly Necessary",
          "First-Party (MyJudicial)",
          "HTTP Cookie (HttpOnly, Secure)",
          "30 Days (if Remembered) or 8h-24h (Session)",
          "Maintains authenticated user session; stores encrypted JWT containing user ID, role, and API credentials."
        ],
        [
          "authjs.csrf-token",
          "Strictly Necessary",
          "First-Party (MyJudicial)",
          "HTTP Cookie (HttpOnly, Secure)",
          "Browser Session",
          "Cryptographic token protecting authentication forms against Cross-Site Request Forgery (CSRF) attacks."
        ],
        [
          "authjs.callback-url",
          "Strictly Necessary",
          "First-Party (MyJudicial)",
          "HTTP Cookie (HttpOnly, Secure)",
          "Browser Session",
          "Remembers post-authentication redirect destination so users return to their requested page after login."
        ],
        [
          "NEXT_LOCALE",
          "Preferences",
          "First-Party (MyJudicial / next-intl)",
          "HTTP Cookie",
          "1 Year (Persistent)",
          "Stores the user's explicit language choice (en, fr, or rw) to ensure localized routing and UI consistency."
        ],
        [
          "sidebar_state",
          "Functional",
          "First-Party (MyJudicial)",
          "HTTP Cookie",
          "7 Days (max-age=604800)",
          "Remembers whether the admin dashboard navigation sidebar is expanded or collapsed."
        ]
      ]
    },
    {
      "id": "sec-6-intro",
      "type": "prose",
      "heading": "6. Browser LocalStorage & SessionStorage Inventory",
      "body": "The following table documents client-side storage keys utilized across the MyJudicial frontend interface:"
    },
    {
      "id": "sec-6-table",
      "type": "table",
      "columns": [
        "Storage Key",
        "Storage Mechanism",
        "Category",
        "Duration",
        "Purpose"
      ],
      "rows": [
        [
          "theme",
          "localStorage",
          "Preferences",
          "Persistent until cleared",
          "Stores user's visual interface preference (light, dark, or system mode) via next-themes."
        ],
        [
          "mj_lang",
          "localStorage",
          "Preferences",
          "Persistent until cleared",
          "Client-side cache of selected language code used for API request headers and AI translation triage."
        ],
        [
          "mj_timezone",
          "localStorage",
          "Functional / Preferences",
          "Persistent until cleared",
          "Stores client scheduling timezone (defaults to Africa/Kigali) for consultation booking time slot calculation."
        ],
        [
          "expert_onboarding_wizard_data",
          "localStorage",
          "Functional",
          "Transient (auto-cleared upon submission)",
          "Auto-saves drafted advocate onboarding application data to prevent data loss on accidental browser refresh."
        ],
        [
          "accessToken / refreshToken",
          "sessionStorage / localStorage",
          "Strictly Necessary",
          "Session or until sign-out",
          "Temporary client-side token cache for authenticated REST API calls; purged immediately upon user logout."
        ]
      ]
    },
    {
      "id": "sec-7",
      "type": "prose",
      "heading": "7. Third-Party Technical Services & Zero-Cookie Architecture",
      "body": "We audit all external technical dependencies to guarantee they do not place tracking cookies on your device:\n\n• MapLibre GL Vector Maps: Interactive chamber location maps use open-source MapLibre GL with self-hosted vector tiles. No Google Maps cookies or Mapbox tracking identifiers are placed on your browser.\n• LiveKit WebRTC Virtual Consultations: Video consultations are powered by LiveKit Cloud using end-to-end encrypted WebSockets and WebRTC peer channels. LiveKit operates without placing persistent tracking cookies.\n• Artificial Intelligence Triage: Case triage inquiries are processed in-memory through our secure backend microservice. AI interactions set no client-side cookies or advertising trackers.\n• Supabase Realtime: WebSockets are utilized exclusively for real-time messaging and notification dispatch without setting persistent third-party cookies."
    },
    {
      "id": "sec-8",
      "type": "prose",
      "heading": "8. Legal Basis & Consent Under Law No. 058/2021",
      "body": "Statutory Lawful Basis: Under Article 46 of Law No. 058/2021, the processing of data via strictly necessary cookies is justified by Contractual Performance (Article 46(1)(b)) and Legitimate Interests (Article 46(1)(f)) to secure platform infrastructure, authenticate accounts, and prevent fraud.\n\nUser-Requested Preferences: Preference cookies (such as language selection and theme mode) are stored strictly pursuant to your deliberate user requests to tailor the interface.\n\nWhy No Consent Banner Is Displayed: Because MyJudicial deploys ZERO non-essential advertising, targeting, or third-party profiling cookies, Rwandan and international data protection laws do not mandate an obstructive cookie banner. Should we ever introduce optional analytical or marketing tools in the future, we will deploy an explicit, prior-consent preference center before any such cookies are loaded."
    },
    {
      "id": "sec-9",
      "type": "prose",
      "heading": "9. How to Control, Inspect & Disable Cookies in Your Browser",
      "body": "You have full technical control over cookies stored on your device. Every modern web browser provides settings allowing you to view, manage, block, or delete cookies:\n\n• Google Chrome: Settings → Privacy and security → Third-party cookies → See all site data and permissions.\n• Mozilla Firefox: Settings → Privacy & Security → Cookies and Site Data → Manage Data.\n• Apple Safari: Settings → Safari → Advanced → Privacy → Block all cookies.\n• Microsoft Edge: Settings → Cookies and site permissions → Manage and delete cookies and site data.\n\nConsequences of Disabling Cookies: If you configure your browser to block all cookies, you will be unable to sign in to your MyJudicial account, access the client/advocate portal, manage bookings, or execute secure payments. Public browsing of advocate profiles and directory search will remain available."
    },
    {
      "id": "sec-10",
      "type": "prose",
      "heading": "10. Updates to This Cookie Policy",
      "body": "We may periodically update this Cookie Policy to reflect technical enhancements, architectural updates, or changes in applicable Rwandan regulations. When modifications occur, the \"Last updated\" date at the top of this document will be updated accordingly.\n\nWe encourage you to review this policy periodically to remain informed about our technical data practices."
    },
    {
      "id": "sec-11",
      "type": "prose",
      "heading": "11. Contact Us & Data Protection Inquiries",
      "body": "For questions regarding this Cookie Policy, our browser storage practices, or to exercise your statutory rights under Law No. 058/2021, please reach out to our privacy office:\n\n• Data Controller: MyJudicial Ltd\n• Data Protection Officer (DPO) Email: {{dpoEmail}}\n• General Support Email: {{supportEmail}}\n• Telephone Hotline: {{hotlinePhone}}\n• Physical Headquarters: {{officeAddress}}\n• Postal Address: {{poBox}}\n• Business Hours: {{workingHours}}\n\nFor broader inquiries regarding personal data processing, please visit our comprehensive Privacy Policy."
    }
  ],
  "status": "published",
  "locale": "en",
  "effectiveDate": "October 1, 2026",
  "metaTitle": "Cookie Policy | MyJudicial",
  "metaDescription": "Transparent disclosure of all HTTP cookies, browser storage, and client technologies used by MyJudicial under Rwanda Law No. 058/2021."
},
  {
    "slug": "ABOUT",
    "title": "Democratizing Access to Justice Across Rwanda",
    "blocks": [
      {
        "id": "hero-subtitle",
        "type": "prose",
        "body": "We bridge the gap between citizens, businesses, and certified legal advocates—combining Bar accreditation, upfront pricing, and modern technology."
      },
      {
        "id": "mission",
        "type": "prose",
        "body": "To democratize access to justice in Rwanda by providing a transparent, efficient, and secure platform that connects individuals and businesses with verified legal professionals.",
        "heading": "Our Mission"
      },
      {
        "id": "vision",
        "type": "prose",
        "body": "To become the leading digital legal infrastructure in Africa, where finding a lawyer is as easy as booking a flight, and legal processes are streamlined for maximum efficiency.",
        "heading": "Our Vision"
      },
      {
        "id": "story",
        "type": "prose",
        "body": "Bridging Rwanda's legal gap with trust, technology, and transparency.\n\nThe Legal Challenge in Rwanda\n\nMyJudicial was born out of a simple observation: finding the right lawyer in Rwanda was often complicated, opaque, and intimidating for the average person or small business.\n\nThe Digital Legal Infrastructure\n\nWe realized that by leveraging technology, we could bridge the gap between talented legal professionals and those who need their services. Today, MyJudicial is a comprehensive ecosystem that not only helps clients find lawyers but also provides lawyers with the tools they need to manage and grow their practice.",
        "heading": "Our Story"
      },
      {
        "id": "verification-intro",
        "type": "prose",
        "body": "Every advocate on MyJudicial passes a documented, audited review before their profile goes live.",
        "heading": "The 4-Stage Advocate Verification Protocol"
      },
      {
        "id": "verification-1",
        "type": "prose",
        "body": "A government-issued ID and an active Rwanda Bar Association (RBA) licence are collected and checked by our review team before any profile is drafted.",
        "heading": "Identity & License Verification"
      },
      {
        "id": "verification-2",
        "type": "prose",
        "body": "Registration details are cross-referenced against the official RBA Roll of Advocates to confirm the advocate is in good standing.",
        "heading": "Official Roll Cross-Check"
      },
      {
        "id": "verification-3",
        "type": "prose",
        "body": "Advocates agree to published fixed fees, escrow terms, and the platform code of conduct before offering consultations.",
        "heading": "Conduct & Fee Review"
      },
      {
        "id": "verification-4",
        "type": "prose",
        "body": "A final human review approves the published profile. Every step of the process is written to an audit log.",
        "heading": "Go-Live Human Review"
      },
      {
        "id": "core-values",
        "type": "coreValues",
        "heading": "Our Core Values",
        "values": [
          {
            "id": "access",
            "title": "Access",
            "description": "We believe everyone deserves access to quality legal representation, regardless of their background or connections.",
            "icon": "Users"
          },
          {
            "id": "transparency",
            "title": "Transparency",
            "description": "Clear, upfront pricing with no hidden fees. You always know what you're paying for before you commit.",
            "icon": "Scale"
          },
          {
            "id": "trust",
            "title": "Trust",
            "description": "Every lawyer on our platform is strictly vetted and verified. Your payments and data are always secure.",
            "icon": "ShieldCheck"
          },
          {
            "id": "compliance",
            "title": "Privacy & Legal Privilege",
            "description": "Operating in strict compliance with Law No. 058/2021 on Personal Data Protection, with encrypted consultations preserving client privilege.",
            "icon": "Lock"
          }
        ]
      },
      {
        "id": "milestones",
        "type": "milestones",
        "heading": "Our Journey",
        "items": [
          {
            "id": "m-1",
            "year": "2024",
            "title": "The Idea",
            "description": "MyJudicial starts with a simple observation: finding a lawyer in Rwanda should not be opaque, slow, or intimidating."
          },
          {
            "id": "m-2",
            "year": "2025",
            "title": "Verification & Escrow",
            "description": "The advocate verification protocol and fee escrow are built, so credentials and payments are protected by default."
          },
          {
            "id": "m-3",
            "year": "2026",
            "title": "An Open Marketplace",
            "description": "A trilingual public platform ships with secure video consultations and AI-assisted case triage for clients across Rwanda."
          }
        ]
      },
      {
        "id": "governance-intro",
        "type": "prose",
        "body": "Clear rules that keep the marketplace fair for clients and advocates alike.",
        "heading": "Institutional Governance & Ethics"
      },
      {
        "id": "governance-1",
        "type": "prose",
        "body": "A paid consultation fee is held in escrow and released to the advocate only after the consultation is completed, or refunded on cancellation.",
        "heading": "Escrow Release Only on Completion"
      },
      {
        "id": "governance-2",
        "type": "prose",
        "body": "Published fees are fixed and tied to a single consultation. There are no hidden charges, and disputes follow a documented process.",
        "heading": "One Fee, One Consultation"
      },
      {
        "id": "governance-3",
        "type": "prose",
        "body": "Consultations are private, limited to the booked participants, and never recorded. Data is handled under Rwanda Law No. 058/2021.",
        "heading": "Confidentiality by Design"
      },
      {
        "id": "ecosystem-intro",
        "type": "prose",
        "body": "MyJudicial collaborates with accredited institutions across Rwanda to ensure professional standards and seamless escrow execution.",
        "heading": "Built with Rwanda's Legal & Financial Institutions"
      },
      {
        "id": "ecosystem-legal",
        "type": "prose",
        "body": "Cross-referenced with the official Rwanda Bar Association (RBA) Roll of Advocates. Every practicing lawyer's active license and standing is verified.",
        "heading": "Legal Framework & Bar Standards"
      },
      {
        "id": "ecosystem-financial",
        "type": "prose",
        "body": "Integrated with MTN Mobile Money, Airtel Money, and licensed commercial banking escrow custody to guarantee 100% funds protection.",
        "heading": "Escrow Banking & Mobile Money"
      },
      {
        "id": "ecosystem-regulatory",
        "type": "prose",
        "body": "Operating in strict compliance with Law No. 058/2021 relating to the protection of personal data and privacy in Rwanda.",
        "heading": "Regulatory & Data Compliance"
      },
      {
        "id": "ecosystem-cta",
        "type": "callout",
        "heading": "Institutional Inquiries",
        "body": "Are you a legal institution, bar council, NGO, or corporate partner looking to collaborate?",
        "tone": "info"
      },
      {
        "id": "disclaimer",
        "type": "callout",
        "heading": "Regulatory Notice",
        "body": "MyJudicial is an independent technology platform connecting clients with accredited Rwanda Bar Association advocates. MyJudicial is not a law firm and does not provide legal representation directly.",
        "tone": "warning"
      }
    ],
    "status": "draft",
    "locale": "en"
  },
  {
    "slug": "CAREERS",
    "title": "Build the future of accessible legal services",
    "blocks": [
      {
        "id": "hero-subtitle",
        "type": "prose",
        "body": "MyJudicial is a marketplace that connects Rwandan clients with legal practitioners whose credentials are reviewed before their profile goes live. The product is young, and a lot of it is still being built."
      },
      {
        "id": "why-intro",
        "type": "prose",
        "body": "Work on software that answers an ordinary, everyday problem: finding and paying a lawyer when you have no referral and no idea what it should cost.",
        "heading": "Why Build With MyJudicial"
      },
      {
        "id": "why-access",
        "type": "prose",
        "body": "Someone outside Kigali, with no referral, can search by practice area and location, see the fixed consultation fee before committing, and read the site in their own language.",
        "heading": "Universal Legal Access"
      },
      {
        "id": "why-transparency",
        "type": "prose",
        "body": "Consultation fees are published up front instead of being negotiated case by case. A paid fee is tied to one specific consultation in an internal escrow ledger, and released or refunded against that booking.",
        "heading": "Pricing & Fee Transparency"
      },
      {
        "id": "why-verification",
        "type": "prose",
        "body": "Every advocate submits identity documents and a bar certificate. Our review team checks each submission by hand before a profile is published, and every decision is logged. Bar numbers are not checked against the Bar Association's own register.",
        "heading": "Reviewed Credentials"
      },
      {
        "id": "why-impact",
        "type": "prose",
        "body": "The work shows up in whether one person can find an advocate, understand the price, and move a legal matter forward without knowing anyone in the profession.",
        "heading": "Practical Local Impact"
      },
      {
        "id": "workon-intro",
        "type": "prose",
        "body": "The systems behind the platform, including the parts that are not finished yet.",
        "heading": "What We Work On"
      },
      {
        "id": "workon-marketplace",
        "type": "prose",
        "body": "Map and text search with filters for practice area, price range, rating, experience and availability, across ten named practice areas.",
        "heading": "Marketplace & Discovery"
      },
      {
        "id": "workon-payments",
        "type": "prose",
        "body": "Mobile money checkout through a payment aggregator, an escrow ledger that holds a paid fee against a consultation, refunds on cancellation, and expert earnings reporting. Live disbursement, card support and dispute handling are not built yet.",
        "heading": "Payments & Service Infrastructure"
      },
      {
        "id": "workon-ai",
        "type": "prose",
        "body": "Someone describes a legal situation in their own words and gets back the likely practice area, how urgent it looks, a cost range, and advocates who match.",
        "heading": "AI-Assisted Case Triage"
      },
      {
        "id": "workon-video",
        "type": "prose",
        "body": "Browser-based calls over WebRTC, with room access limited to the two booked participants and no session recording. Frame-level end-to-end encryption is not switched on today.",
        "heading": "Private Video Consultations"
      },
      {
        "id": "workon-verification",
        "type": "prose",
        "body": "Identity documents and bar certificates are encrypted at rest, streamed only to the reviewer handling them, and every review action is written to an audit log.",
        "heading": "Credential Review"
      },
      {
        "id": "workon-localization",
        "type": "prose",
        "body": "The public product ships in Kinyarwanda, English and French. Coverage is still uneven across the product, and closing that gap is ongoing work.",
        "heading": "Trilingual Product"
      },
      {
        "id": "how-intro",
        "type": "prose",
        "body": "A few principles we actually use to make decisions.",
        "heading": "How We Work"
      },
      {
        "id": "how-p1",
        "type": "prose",
        "body": "A change is worth making if it removes friction, confusion or intimidation for someone trying to get legal help. If it does not, it probably should not ship.",
        "heading": "User-First"
      },
      {
        "id": "how-p2",
        "type": "prose",
        "body": "Legal matters are sensitive. We take privacy, security and careful handling of information seriously, and our Privacy Policy sets out in detail what we collect and why.",
        "heading": "Build Responsibly & Protect Privacy"
      },
      {
        "id": "how-p3",
        "type": "prose",
        "body": "When something is not finished, we say so. We would rather be accurate about what the product does than impressive about what it might do.",
        "heading": "Trust Through Accuracy"
      },
      {
        "id": "how-p4",
        "type": "prose",
        "body": "We favour what works on an ordinary phone and an ordinary network in Rwanda over what only works in a demo.",
        "heading": "Solve Real Problems"
      },
      {
        "id": "jobs",
        "type": "jobs"
      },
      {
        "id": "faq-1",
        "type": "prose",
        "body": "MyJudicial is based in Kigali, Rwanda.",
        "heading": "Where is MyJudicial based?"
      },
      {
        "id": "faq-2",
        "type": "prose",
        "body": "Yes. Write to the careers address shown on this page. A member of the team reads it. Nothing about you is stored on this site, so if you want to follow up, reply to the message you sent.",
        "heading": "Can I get in touch if there are no open positions?"
      },
      {
        "id": "faq-3",
        "type": "prose",
        "body": "A short introduction, your CV or resume, links to work you are proud of, and which parts of the platform you would like to work on.",
        "heading": "What should I include?"
      },
      {
        "id": "faq-4",
        "type": "prose",
        "body": "The public product is available in Kinyarwanda, English and French. Coverage is not yet complete on every screen.",
        "heading": "Which languages does MyJudicial support?"
      },
      {
        "id": "cta",
        "type": "callout",
        "heading": "Interested in working with us?",
        "body": "Tell us what you would like to work on, or go and see what MyJudicial does today.\n\nSend an Expression of Interest",
        "tone": "info"
      }
    ],
    "status": "draft",
    "locale": "en"
  },
  {
    "slug": "CONTACT",
    "title": "Get in Touch",
    "blocks": [
      {
        "id": "hero-subtitle",
        "type": "prose",
        "body": "We're here to help. Reach out to our legal operations team in Kigali for client support, advocate verification, or institutional partnerships."
      },
      {
        "id": "departments",
        "type": "prose",
        "body": "Citizen & Client Support — Help with consultation bookings, LiveKit video rooms, and Mobile Money/Airtel escrow inquiries. (support@myjudicial.com)\n\nAdvocate & Bar Roll Verification — Rwanda Bar Association credential verification, professional profile onboarding, and payouts. (support@myjudicial.com)\n\nInstitutional Partnerships — Bar council collaborations, NGO access-to-justice programs, and corporate legal infrastructure. (support@myjudicial.com)",
        "heading": "Contact Information"
      },
      {
        "id": "office",
        "type": "prose",
        "body": "Centenary House, 4th Floor, KN 3 Ave & KN 4 St\n\nNyarugenge Central Business District, Kigali, Rwanda\n\nAdjacent to the Commercial Court of Nyarugenge\n\nBusiness Hours: Monday – Friday: 8:00 AM – 6:00 PM (CAT)",
        "heading": "Kigali Headquarters"
      },
      {
        "id": "channels",
        "type": "callout",
        "heading": "Email",
        "body": "support@myjudicial.com\n\n+250 788 312 456",
        "tone": "info"
      },
      {
        "id": "contact-card",
        "type": "contactCard"
      },
      {
        "id": "self-service",
        "type": "prose",
        "body": "Access our verified legal marketplace and resources without waiting for email correspondence.\n\nFind a Verified Advocate: Browse 100+ Rwanda Bar Association advocates with verified courtroom experience and transparent upfront fees.\n\nTransparent Pricing & Escrow: Learn how MoMo and Airtel Money payments are held in regulated escrow until your consultation concludes.\n\nKnowledge Center & FAQs: Step-by-step guides on booking, uploading UPI land documents, and joining encrypted video rooms.",
        "heading": "Looking for Immediate Counsel or Answers?"
      }
    ],
    "status": "draft",
    "locale": "en"
  },
  {
    "slug": "TERMS",
    "title": "Conditions Générales d'Utilisation",
    "blocks": [
      {
        "id": "sec-1",
        "type": "prose",
        "body": "En accédant ou en utilisant les Services, vous acceptez d'être lié par les présentes Conditions et par notre Politique de Confidentialité. Si vous n'acceptez pas ces Conditions, n'utilisez pas les Services.",
        "heading": "1. Acceptation des conditions"
      },
      {
        "id": "sec-2",
        "type": "prose",
        "body": "Pour accéder à certaines fonctionnalités des Services, vous devez créer un compte. Vous êtes responsable de la protection de vos identifiants et de toutes les activités réalisées depuis votre compte. Vous devez avoir au moins 18 ans pour créer un compte.",
        "heading": "2. Comptes utilisateurs"
      },
      {
        "id": "sec-3",
        "type": "prose",
        "body": "MyJudicial est une plateforme mettant en relation des clients avec des professionnels du droit. MyJudicial ne fournit pas elle-même de conseils juridiques. Lorsque vous réservez une consultation, le paiement est conservé dans notre système de séquestre sécurisé et n'est reversé à l'avocat qu'à la suite de la réalisation effective de la consultation.",
        "heading": "3. Plateforme et séquestre"
      },
      {
        "id": "sec-4",
        "type": "prose",
        "body": "Les Services sont fournis « TELS QUELS » et « SELON DISPONIBILITÉ ». Nous rejetons toute garantie, expresse ou implicite, y compris les garanties implicites de qualité marchande, d'adéquation à un usage particulier et de non-contrefaçon.",
        "heading": "4. Avertissements"
      }
    ],
    "status": "published",
    "locale": "fr"
  },
  {
    "slug": "PRIVACY",
    "title": "Politique de Confidentialité",
    "blocks": [
      {
        "id": "sec-1",
        "type": "prose",
        "heading": "1. Qui nous sommes et responsable du traitement",
        "body": "MyJudicial Ltd (« MyJudicial », « nous », « notre » ou « nos ») exploite la première plateforme numérique de services juridiques au Rwanda, connectant les justiciables, les entrepreneurs et les organisations à des avocats et professionnels du droit vérifiés et certifiés. Au sens de la loi rwandaise n° 058/2021 relative à la protection des données à caractère personnel et de la vie privée, MyJudicial agit en qualité de responsable du traitement pour les données personnelles collectées et traitées sur notre site web (myjudicial.com) et ses services connexes.\n\nNotre siège social est situé à Centenary House, 4ème étage, KN 3 Ave & KN 4 St, Quartier des affaires de Nyarugenge, B.P. 2848, Kigali, Rwanda. Nous avons désigné un Délégué à la Protection des Données (DPO) joignable directement à l'adresse legal@myjudicial.com pour toute demande relative à vos droits ou à la conformité réglementaire."
      },
      {
        "id": "sec-2",
        "type": "prose",
        "heading": "2. Champ d'application des services",
        "body": "La présente Politique de Confidentialité s'applique à la collecte, au traitement et à la protection des données personnelles sur l'ensemble des services MyJudicial, notamment :\n\n• La recherche d'avocats, la consultation de l'annuaire et la géolocalisation cartographique des cabinets ;\n• Le questionnaire d'accueil des clients et le triage des dossiers assisté par IA ;\n• La prise de rendez-vous, la gestion des consultations et la visioconférence sécurisée via LiveKit ;\n• Le système d'entiercement (escrow) pour la sécurisation des honoraires de consultation ;\n• Le coffre-fort numérique chiffré pour le stockage de pièces juridiques (stockage d'objets OCI) ;\n• La création de profil, la vérification et la gestion de la conformité des avocats agréés.\n\nLimite de champ : Cette politique s'applique à la plateforme et à l'infrastructure opérées par MyJudicial. Lorsque vous mandatez un avocat pour une représentation en justice ou un conseil formel, ce dernier agit en professionnel indépendant tenu au secret professionnel légal et aux règles déontologiques du Barreau du Rwanda."
      },
      {
        "id": "sec-3",
        "type": "prose",
        "heading": "3. Données que nous collectons",
        "body": "Nous ne collectons que les données personnelles strictement nécessaires à la fourniture de nos services. Ces données sont classées comme suit :\n\n• Données de compte et d'authentification : Nom, prénom, adresse e-mail, numéro de téléphone, mot de passe haché de manière irréversible (Argon2/bcrypt), identifiants de connexion OAuth (Google, LinkedIn), langue préférée et rôle (Citoyen, Expert, Administrateur).\n• Données professionnelles des avocats : Nom d'exercice, biographie, cabinet d'attache, adresse physique, numéro d'inscription au Barreau du Rwanda (RBA), certificat de pratique valide, copie de carte nationale d'identité/passeport, diplômes académiques, spécialités juridiques, tarifs de consultation et numéro Mobile Money pour les reversements.\n• Données de réservation et de consultation : Type de service juridique, modalité d'exécution (visioconférence, téléphone, présentiel), date et créneau horaire, notes préparatoires du client, identifiant de salle de réunion et historique d'annulation/report.\n• Communications sur la plateforme : Messages directs échangés entre clients et avocats, pièces jointes (PDF, contrats, assignations) et horodatages de remise et de lecture.\n• Documents du coffre-fort juridique : Actes, contrats, preuves et documents d'identité versés au coffre-fort numérique, protégés par chiffrement client AES-256-GCM avant stockage dans l'infrastructure OCI.\n• Données financières et d'entiercement (Escrow) : Références de transaction Mobile Money (MTN, Airtel), identifiants AzamPay, montants consignés et reversements aux avocats. MyJudicial ne stocke JAMAIS les numéros de carte bancaire ni les codes secrets PIN Mobile Money.\n• Données de triage IA : Descriptif du litige soumis par écrit ou note vocale, transcriptions traitées en mémoire, domaine du droit identifié, degré d'urgence et fourchette budgétaire.\n• Données géographiques : Coordonnées GPS transmises à la demande pour la recherche sur carte (par défaut : Nyarugenge, Kigali : -1.9441, 30.0619) et coordonnées d'implantation des cabinets d'avocats.\n• Données techniques et journaux d'audit : Adresses IP, en-têtes du navigateur, horodatages de connexion et journaux d'audit immuables (AuditLog) traçant les actions critiques."
      },
      {
        "id": "sec-4",
        "type": "prose",
        "heading": "4. Modalités de collecte des données",
        "body": "Nous collectons vos données personnelles selon des mécanismes directs, transparents et vérifiables :\n\n• Directement auprès de vous : Lors de la création de compte, de la saisie du profil, du questionnaire de prise en charge, du versement de pièces au coffre-fort, de l'envoi de messages ou du paiement d'une consultation.\n• Automatiquement lors de l'utilisation : Les témoins de connexion (cookies) essentiels, les paramètres techniques du terminal, les adresses IP et les journaux de diagnostic sont consignés pour garantir la sécurité et le bon fonctionnement du service.\n• Soumissions des professionnels du droit : Lorsque les avocats sollicitent leur inscription sur la plateforme et fournissent leurs diplômes, attestations du Barreau et créneaux de disponibilité.\n• Vérifications réglementaires officielles : Notre équipe de conformité vérifie systématiquement les mentions déclarées auprès du Tableau de l'Ordre officiel publié par le Barreau du Rwanda."
      },
      {
        "id": "sec-5",
        "type": "prose",
        "heading": "5. Finalités du traitement des données",
        "body": "MyJudicial traite vos données personnelles uniquement pour des finalités licites, explicites et déterminées :\n\n• Gestion de la plateforme et des comptes : Enregistrement des utilisateurs, authentification sécurisée, gestion des droits et administration des profils.\n• Vérification des avocats et prévention de l'exercice illégal : Contrôle de l'inscription au Barreau, protection des justiciables et fiabilisation des titres professionnels.\n• Réservation et consultations virtuelles : Planification des rendez-vous, gestion des agendas et ouverture des salons de visioconférence WebRTC sécurisés via LiveKit.\n• Entiercement financier (Escrow) et reversements : Séquestre des honoraires de consultation et versement sur les comptes Mobile Money des avocats après réalisation de la prestation.\n• Coffre-fort numérique chiffré : Hébergement sécurisé et chiffré de bout en bout des dossiers juridiques, pièces de procédure et preuves documentaires.\n• Triage d'accueil assisté par IA : Analyse préliminaire du litige, évaluation de l'urgence et suggestion d'avocats pertinents selon leurs spécialités déclarées.\n• Notifications opérationnelles et communications de service : Envoi de rappels de rendez-vous, codes de sécurité (OTP), reçus de paiement et alertes par SMS et e-mail (Brevo).\n• Sécurité, audit et conformité légale : Détection des incidents de sécurité, résolution des différends, conservation des journaux d'audit et respect des obligations fiscales et légales au Rwanda."
      },
      {
        "id": "sec-6",
        "type": "prose",
        "heading": "6. Bases légales du traitement (Loi n° 058/2021)",
        "body": "Conformément à l'article 46 de la loi rwandaise n° 058/2021 sur la protection des données personnelles, MyJudicial fonde ses traitements sur les bases juridiques suivantes :\n\n• Exécution d'un contrat (Article 46(1)(b)) : Le traitement est nécessaire à l'exécution de nos conditions de service et des prestations convenues avec vous (réservation de consultations, consignation d'honoraires en séquestre, coffre-fort numérique et gestion de votre compte).\n• Respect d'une obligation légale (Article 46(1)(c)) : Le traitement est requis pour respecter les lois commerciales rwandaises, les exigences de comptabilité financière, la lutte contre le blanchiment de capitaux, les déclarations auprès de l'Office Rwandais des Recettes (RRA) et les réquisitions judiciaires régulières.\n• Intérêts légitimes (Article 46(1)(f)) : Le traitement répond aux intérêts légitimes de MyJudicial et des justiciables, notamment pour vérifier l'authenticité des titres d'avocat sur le Tableau du Barreau, prévenir la fraude, sécuriser nos serveurs contre les intrusions et conserver des journaux d'audit, dans le respect de vos droits fondamentaux.\n• Consentement exprès (Article 46(1)(a)) : Nous sollicitons votre accord explicite pour certaines fonctionnalités facultatives, comme l'activation de la géolocalisation pour la carte ou la transmission de notes vocales pour transcription par IA. Ce consentement peut être retiré à tout moment."
      },
      {
        "id": "sec-7",
        "type": "prose",
        "heading": "7. Partage des données et destinataires",
        "body": "Nous ne vendons, ne louons et ne commercialisons en aucun cas vos données personnelles. Celles-ci sont transmises uniquement aux catégories de destinataires suivantes :\n\n• Avocats et experts choisis : Lorsque vous sollicitez un avocat ou confirmez un rendez-vous, vos coordonnées, le résumé de votre litige et vos pièces partagées lui sont transmis pour lui permettre d'étudier votre dossier.\n• Fournisseurs d'infrastructure cloud et partenaires techniques :\n  - Hébergement base de données et authentification : Supabase / Amazon Web Services (AWS).\n  - Coffre-fort numérique chiffré : Oracle Cloud Infrastructure (OCI) Object Storage avec gestion des clés via OCI KMS.\n  - Visioconférence en temps réel : LiveKit Cloud pour les flux vidéo/audio WebRTC chiffrés.\n  - Communications transactionnelles : Brevo pour l'acheminement des e-mails, alertes de rendez-vous et SMS.\n  - Cache et gestion des sessions : Upstash Redis.\n  - Passerelle de paiement et séquestre : AzamPay pour les transactions Mobile Money et les reversements aux avocats.\n• Barreau du Rwanda et instances ordinales : Dans le cadre exclusif de la vérification d'inscription ou du traitement d'éventuels signalements déontologiques.\n• Autorités judiciaires et répressives : Uniquement lorsqu'une ordonnance judiciaire exécutoire ou une injonction légale valide nous est notifiée par une autorité judiciaire rwandaise compétente."
      },
      {
        "id": "sec-8",
        "type": "prose",
        "heading": "8. Confidentialité et secret professionnel de l'avocat",
        "body": "Secret professionnel et privilège légal : Au regard du droit rwandais et des règles de l'Ordre des Avocats du Rwanda, les échanges et pièces confiés à un avocat dans le cadre d'un conseil ou d'une procédure bénéficient de la protection absolue du secret professionnel. L'avocat consulté est légalement tenu de préserver la confidentialité de toutes les informations reçues.\n\nGaranties techniques de la plateforme : MyJudicial est conçu pour respecter cette obligation déontologique fondamentale. Les documents versés au coffre-fort sont protégés par chiffrement client AES-256-GCM. Les équipes techniques et opérationnelles de MyJudicial n'ont aucun droit d'accès pour déchiffrer ou lire les dossiers de consultation ou les pièces confidentielles, hors impératif technique de maintenance strictement audité ou décision contraignante d'un tribunal rwandais."
      },
      {
        "id": "sec-9",
        "type": "prose",
        "heading": "9. Fonctionnalités d'intelligence artificielle et transparence",
        "body": "MyJudicial intègre des outils d'intelligence artificielle via son microservice dédié (myjudicial-ai-service) pour faciliter le triage et l'orientation des justiciables :\n\n• Transcription vocale (Whisper) : Si vous enregistrez un message vocal pour exposer votre litige, notre moteur local Whisper convertit la parole en texte en mémoire vive. Le flux audio n'est pas conservé après transcription.\n• Qualification juridique préliminaire : Notre modèle linguistique (Ollama auto-hébergé avec Qwen2.5 ou inférence cloud sécurisée) analyse la description factuelle afin d'identifier la branche du droit applicable (Droit foncier, Droit de la famille, Droit commercial) et le niveau d'urgence.\n• Recherche sémantique vectorielle : Le texte de l'exposé est converti en représentations vectorielles (sentence-transformers all-MiniLM-L6-v2) pour vous proposer les avocats les plus adaptés à votre besoin.\n• AUCUN ENTRAÎNEMENT DE MODÈLES : Vos déclarations de faits, pièces jointes, enregistrements vocaux et échanges ne sont JAMAIS utilisés pour entraîner ou affiner des modèles d'IA publics ou propriétaires.\n• Caractère strictement informatif : Les analyses de l'IA constituent de simples suggestions d'orientation. L'IA ne fournit aucun conseil juridique, ne rédige aucun acte engageant et ne remplace en aucun cas l'analyse d'un avocat inscrit au Barreau."
      },
      {
        "id": "sec-10",
        "type": "prose",
        "heading": "10. Décisions automatisées et classement algorithmique",
        "body": "Absence de décision juridique automatisée : MyJudicial ne prend AUCUNE décision automatisée produisant des effets juridiques ou vous affectant de manière significative (tel qu'un refus automatique d'accès, une résiliation unilatérale de compte ou une fixation arbitraire d'honoraires).\n\nAlgorithme transparent de classement des avocats : Lorsque vous effectuez une recherche, les profils d'avocats sont ordonnés selon un barème multicritère objectif et transparent :\n\n1. Pertinence sémantique (40 %) : Degré de correspondance entre la description de votre litige et le profil de l'avocat ;\n2. Note et avis des clients (25 %) : Moyenne des évaluations attribuées par des clients réels à l'issue de consultations effectives ;\n3. Adéquation budgétaire (15 %) : Rapprochement entre le tarif forfaitaire de l'avocat et votre budget indicatif ;\n4. Volume d'avis vérifiés (10 %) : Nombre de consultations évaluées ;\n5. Années d'expérience (5 %) : Ancienneté d'exercice depuis la prestation de serment au Barreau ;\n6. Spécialité principale (5 %) : Correspondance exacte avec la matière préférentielle déclarée.\n\nLibre choix du justiciable : Cet algorithme sert uniquement à ordonner l'affichage. Vous conservez la liberté totale de filtrer, comparer et solliciter l'avocat de votre choix, indépendamment du classement suggéré."
      },
      {
        "id": "sec-11",
        "type": "prose",
        "heading": "11. Données de localisation et recherche cartographique",
        "body": "Géolocalisation à la demande : Pour vous aider à trouver des cabinets d'avocats proches de votre domicile ou de votre tribunal de ressort, MyJudicial propose une recherche sur carte interactive. Votre navigateur ne sollicite l'accès à votre position que si vous activez la fonction de recherche de proximité.\n\nPosition par défaut : Si vous refusez l'autorisation, la carte se positionne automatiquement sur le centre des affaires de Kigali (District de Nyarugenge : -1.9441, 30.0619).\n\nAbsence de suivi permanent : Vos coordonnées géographiques sont utilisées en mémoire vive uniquement pour calculer la distance par rapport aux cabinets référencés (fonctions PostGIS ST_DWithin). Elles ne sont jamais suivies en arrière-plan et ne sont jamais enregistrées dans votre profil utilisateur."
      },
      {
        "id": "sec-12",
        "type": "prose",
        "heading": "12. Témoins de connexion (Cookies) et technologies similaires",
        "body": "Cookies essentiels et fonctionnels : Nous utilisons des cookies strictement nécessaires pour maintenir votre session de connexion sécurisée (jetons NextAuth, jetons anti-CSRF et clés de session Supabase) et mémoriser vos préférences (langue choisie : anglais, français, kinyarwanda ; affichage clair ou sombre).\n\nAbsence de traceurs publicitaires tiers : Nous n'utilisons aucun cookie de ciblage publicitaire ni aucun traceur comportemental tiers.\n\nPolitique relative aux cookies dédiée : Pour consulter la liste exhaustive des cookies utilisés, leur durée de conservation et les modalités de gestion, veuillez vous référer à notre Politique relative aux cookies accessible à l'adresse /cookies."
      },
      {
        "id": "sec-13",
        "type": "prose",
        "heading": "13. Durée de conservation et gouvernance des données",
        "body": "Cycle de vie transparent des données : Nous ne conservons vos données que le temps strictement nécessaire à l'accomplissement des finalités prévues et au respect des exigences légales au Rwanda :\n\n• Comptes d'utilisateurs actifs : Les données d'identification et de profil sont conservées tant que votre compte demeure actif ou jusqu'à demande de clôture.\n• Pièces comptables et registres financiers : Les justificatifs de paiement, registres de séquestre (escrow) et factures sont conservés pendant dix (10) ans conformément au code de commerce rwandais et aux exigences fiscales de l'Office Rwandais des Recettes.\n• Pièces du coffre-fort juridique : Les documents juridiques versés au coffre-fort restent stockés jusqu'à suppression volontaire par l'utilisateur ou résiliation du compte.\n• Journaux d'audit et de sécurité : Les journaux traçant les accès et modifications (AuditLog) sont conservés à des fins d'analyse de sécurité et de prévention de la fraude.\n• Feuille de route de gouvernance : Conformément aux orientations du Bureau de Protection des Données (DPO Rwanda), MyJudicial formalise des routines automatisées de purge pour supprimer les fichiers temporaires dès l'échéance des délais légaux."
      },
      {
        "id": "sec-14",
        "type": "prose",
        "heading": "14. Mesures de sécurité techniques et organisationnelles",
        "body": "Nous appliquons une politique de sécurité en profondeur pour prémunir vos données contre toute perte accidentelle, accès non autorisé, altération ou divulgation :\n\n• Chiffrement en transit : Toutes les communications entre votre navigateur et nos serveurs sont protégées par le protocole Transport Layer Security (TLS 1.3 / HTTPS).\n• Chiffrement au repos et coffre-fort : Les pièces déposées sur Oracle Cloud Infrastructure (OCI) sont protégées par chiffrement côté client AES-256-GCM avec gestion des clés d'enveloppe via OCI KMS.\n• Protection des mots de passe : Les mots de passe sont hachés avec sel au moyen d'algorithmes cryptographiques robustes (Argon2/bcrypt) ; aucun mot de passe en clair n'est jamais accessible.\n• Contrôle d'accès basé sur les rôles (RBAC) : Une stricte séparation des privilèges isole les accès entre Citoyens, Experts et Administrateurs, interdisant à notre personnel l'accès aux données sensibles sans motif d'exploitation impératif.\n• Traçabilité et journaux d'audit immuables : Les opérations sensibles (connexions, vérifications d'avocats, téléchargement de pièces, déblocage de séquestre) sont consignées dans des tables d'audit horodatées avec adresse IP."
      },
      {
        "id": "sec-15",
        "type": "prose",
        "heading": "15. Transferts internationaux de données (Articles 40-42)",
        "body": "Localisation des infrastructures : Afin de garantir une haute disponibilité, une résilience éprouvée et une sécurité de niveau entreprise, MyJudicial fait appel à des prestataires cloud internationaux de premier plan dont les centres de données sont situés hors de la République du Rwanda :\n\n• Base de données et authentification : Supabase / Amazon Web Services (AWS) au sein de l'Union européenne et des États-Unis ;\n• Coffre-fort numérique chiffré : Oracle Cloud Infrastructure (OCI) au sein des États-Unis et de l'Union européenne ;\n• Visioconférences en temps réel : Réseau mondial de serveurs LiveKit Cloud ;\n• Envoi d'e-mails et SMS : Centres de données Brevo situés dans l'Union européenne ;\n• Mise en cache : Clusters Upstash Redis situés dans l'Union européenne et aux États-Unis.\n\nConformité légale : Conformément aux articles 40, 41 et 42 de la loi rwandaise n° 058/2021, ces transferts transfrontaliers sont encadrés par des garanties juridiques et techniques strictes, comprenant des accords de traitement des données (DPA) avec clauses contractuelles types, un chiffrement systématique des données et la nécessité du transfert pour l'exécution du contrat qui nous lie à vous (Article 42)."
      },
      {
        "id": "sec-16",
        "type": "prose",
        "heading": "16. Vos droits selon la Loi rwandaise n° 058/2021",
        "body": "En tant que personne concernée par le traitement en vertu de la loi n° 058/2021, vous disposez des droits suivants sur vos données personnelles :\n\n• Droit à l'information (Articles 15 et 16) : Droit de recevoir une information claire, compréhensible et transparente sur nos pratiques de traitement.\n• Droit d'accès (Article 16) : Droit d'obtenir confirmation du traitement de vos données et d'en obtenir une copie structurée.\n• Droit de rectification (Article 18) : Droit d'exiger la mise à jour ou la correction immédiate de données inexactes ou incomplètes. Vous pouvez également modifier vos données courantes dans les paramètres de votre profil.\n• Droit à l'effacement / Droit à l'oubli (Article 19) : Droit d'obtenir la suppression de vos données lorsqu'elles ne sont plus nécessaires ou en cas de retrait de consentement, sous réserve des délais légaux de conservation fiscale et commerciale au Rwanda.\n• Droit à la limitation du traitement (Article 20) : Droit de geler temporairement le traitement pendant la vérification de l'exactitude de vos données.\n• Droit à la portabilité (Article 21) : Droit de recevoir vos données personnelles dans un format structuré et couramment lisible par machine.\n• Droit d'opposition (Article 22) : Droit de vous opposer pour motif légitime aux traitements fondés sur l'intérêt légitime.\n• Droit de retirer votre consentement (Article 46) : Lorsque le traitement repose sur votre accord, vous pouvez le retirer à tout moment sans incidence sur la licéité des traitements antérieurs.\n\nModalités d'exercice : Pour exercer vos droits, adressez votre demande par écrit à notre Délégué à la Protection des Données à legal@myjudicial.com. Une preuve d'identité pourra vous être demandée à des fins de sécurité. Nous accuserons réception sans délai et répondrons dans le délai légal de trente (30) jours fixé par la loi n° 058/2021."
      },
      {
        "id": "sec-17",
        "type": "prose",
        "heading": "17. Protection des mineurs (Moins de 18 ans)",
        "body": "Condition de majorité légale (18 ans) : La plateforme MyJudicial est exclusivement réservée aux personnes majeures âgées d'au moins dix-huit (18) ans et disposant de la pleine capacité juridique pour contracter conformément aux lois de la République du Rwanda.\n\nAssistance juridique aux mineurs : Conformément à l'article 9 de la loi n° 058/2021, les données à caractère personnel d'un enfant ne peuvent être traitées sans le consentement expressément accordé par les titulaires de l'autorité parentale ou le tuteur légal. Si des conseils juridiques concernent un mineur (notamment en matière familiale, successorale ou de protection), la procédure doit être ouverte et gérée sous le contrôle direct du parent ou représentant légal. Si un compte s'avérait avoir été créé directement par un mineur sans autorisation légale, il sera immédiatement supprimé."
      },
      {
        "id": "sec-18",
        "type": "prose",
        "heading": "18. Communications de service et préférences marketing",
        "body": "Messages opérationnels indispensables : Nous vous adressons par SMS et e-mail les notifications strictement nécessaires à l'exécution du service, notamment les rappels de consultation, les codes de vérification de sécurité (OTP), les confirmations de paiement et les alertes d'incident. Ces messages étant indispensables à la sécurité et à la fourniture de la prestation, vous ne pouvez pas vous en désinscrire tant que votre compte est ouvert.\n\nCommunications d'information et lettres d'actualités : Si vous choisissez de recevoir nos guides juridiques, publications éducatives ou annonces de nouvelles fonctionnalités, votre accord préalable est requis. Vous pouvez vous désabonner à tout moment via le lien de désinscription figurant en bas de chaque e-mail d'information."
      },
      {
        "id": "sec-19",
        "type": "prose",
        "heading": "19. Sites tiers et intégrations externes",
        "body": "Liens vers des plateformes tierces : Le site MyJudicial peut comporter des liens hypertextes renvoyant vers des sites externes, tels que le portail officiel du Barreau du Rwanda (rwanda-bar.org), les services judiciaires publics ou les plateformes de paiement partenaires.\n\nIndépendance des politiques tierces : MyJudicial n'exerce aucun contrôle sur le contenu ou les pratiques de confidentialité de ces sites externes. L'accès à ces plateformes relève de votre responsabilité et nous vous invitons à consulter leurs politiques de protection des données respectives."
      },
      {
        "id": "sec-20",
        "type": "prose",
        "heading": "20. Gestion des incidents de sécurité et notification de violation",
        "body": "Procédure de réaction aux incidents : MyJudicial applique un plan d'intervention structuré visant à détecter, contenir et corriger toute violation de sécurité ou intrusion suspectée.\n\nNotification à l'autorité sous 48 heures : Conformément à l'article 43 de la loi rwandaise n° 058/2021, en cas de violation de données personnelles, MyJudicial en informera l'Autorité Nationale de Cybersécurité / Bureau de Protection des Données (NCSA DPO) dans un délai maximal de quarante-huit (48) heures suivant sa découverte.\n\nInformation des personnes concernées : Conformément à l'article 44 de ladite loi, si la violation présente un risque élevé pour vos droits et libertés, vous en serez informé dans les plus brefs délais, avec communication des mesures correctives et des recommandations utiles pour préserver votre sécurité."
      },
      {
        "id": "sec-21",
        "type": "prose",
        "heading": "21. Réclamations auprès de l'Autorité de contrôle (NCSA / DPO Rwanda)",
        "body": "Recours amiable préalable : Si vous estimez que le traitement de vos données n'est pas conforme aux exigences légales, nous vous invitons à saisir en premier lieu notre Délégué à la Protection des Données à legal@myjudicial.com.\n\nDroit de réclamation légal : Vous avez le droit légal, garanti par la loi n° 058/2021, d'introduire une réclamation officielle auprès de l'autorité de contrôle nationale du Rwanda :\n\nNational Cyber Security Authority (NCSA)\nData Protection Office (DPO)\nSite officiel : https://dpo.gov.rw\nE-mail officiel : dpo@ncsa.gov.rw\nSiège : Kigali, République du Rwanda"
      },
      {
        "id": "sec-22",
        "type": "prose",
        "heading": "22. Mises à jour et versions de la politique",
        "body": "Révisions régulières : Nous pouvons actualiser la présente Politique de Confidentialité pour tenir compte des évolutions de notre infrastructure, des réformes législatives ou des directives publiées par le Bureau de Protection des Données.\n\nDate d'effet : La mention de dernière mise à jour figurant en tête de page atteste de la prise d'effet de la version en vigueur.\n\nNotification des modifications substantielles : En cas de modification importante impactant l'étendue de vos droits ou les finalités de traitement, nous vous en informerons préalablement par un avis visible sur la plateforme ou par e-mail direct. Les versions historiques sont archivées dans notre système de gestion de contenu et restent consultables sur demande."
      },
      {
        "id": "sec-23",
        "type": "prose",
        "heading": "23. Nous contacter et Délégué à la Protection des Données",
        "body": "Pour toute question relative à la présente Politique de Confidentialité ou pour exercer vos droits garantis par la loi n° 058/2021, vous pouvez contacter notre service conformité :\n\n• Responsable du traitement : MyJudicial Ltd\n• E-mail du DPO : legal@myjudicial.com\n• E-mail du support : support@myjudicial.com\n• Téléphone : +250 788 312 456\n• Adresse physique : Centenary House, 4ème étage, KN 3 Ave & KN 4 St, Nyarugenge, Kigali, Rwanda\n• Boîte postale : B.P. 2848, Kigali, Rwanda\n• Heures d'ouverture : Du lundi au vendredi : 08h00 – 18h00 CAT"
      }
    ],
    "status": "published",
    "locale": "fr",
    "effectiveDate": "Septembre 2026",
    "metaTitle": "Politique de Confidentialité | MyJudicial",
    "metaDescription": "Découvrez comment MyJudicial protège vos données personnelles conformément à la loi rwandaise n° 058/2021 sur la protection des données."
  },
  {
  "slug": "COOKIES",
  "title": "Politique relative aux Cookies",
  "blocks": [
    {
      "id": "sec-1",
      "type": "prose",
      "heading": "1. Introduction et Champ d'Application Légal",
      "body": "MyJudicial Ltd (« MyJudicial », « nous », « notre » ou « nos ») exploite la plateforme de référence pour les services juridiques au Rwanda, reliant les citoyens, entrepreneurs et institutions avec des avocats certifiés et vérifiés.\n\nLa présente Politique relative aux Cookies explique comment et pourquoi nous utilisons des cookies HTTP, le stockage local du navigateur (localStorage), le stockage de session (sessionStorage) et d'autres technologies similaires lorsque vous consultez notre site web (myjudicial.com) ou utilisez nos services. Cette politique est établie en parfaite conformité avec la loi n° 058/2021 régissant la protection des données à caractère personnel et de la vie privée au Rwanda.\n\nPortée : Ce document traite expressément du stockage du navigateur et des identifiants clients. Pour les détails complets sur la collecte, la conservation et la protection de vos données personnelles globales, veuillez consulter notre Politique de Confidentialité."
    },
    {
      "id": "sec-2",
      "type": "prose",
      "heading": "2. Qu'est-ce qu'un Cookie et le Stockage Local ?",
      "body": "Les applications web modernes emploient plusieurs mécanismes standardisés pour fonctionner avec fiabilité et sécurité :\n\n• Cookies HTTP : Petits fichiers texte enregistrés sur votre ordinateur, tablette ou smartphone par un serveur web. Lorsque vous naviguez entre les pages ou revenez ultérieurement, votre navigateur renvoie ces cookies afin d'authentifier votre session et de maintenir la sécurité.\n• Stockage Local HTML5 (localStorage) : Mécanisme clé-valeur intégré au navigateur. Le localStorage retient vos préférences (choix de langue, thème visuel) localement sur votre terminal sans transférer ces données dans chaque en-tête de requête HTTP.\n• Stockage de Session HTML5 (sessionStorage) : Espace de stockage éphémère limité à l'onglet actif. Toutes les données de session sont automatiquement effacées dès la fermeture de l'onglet ou du navigateur."
    },
    {
      "id": "sec-3",
      "type": "prose",
      "heading": "3. Notre Engagement Fondamental : Zéro Traçage Tiers",
      "body": "Contrairement aux plateformes commerciales ordinaires, MyJudicial est conçu selon les standards les plus stricts de secret professionnel et de confidentialité juridique :\n\n• AUCUN Traçage Comportemental Tiers : Nous n'utilisons pas Google Analytics, le Pixel Meta ou d'autres mouchards publicitaires intersites. Vos recherches et consultations juridiques ne font l'objet d'aucun pistage commercial.\n• AUCUN Cookie Publicitaire ou de Ciblage : Aucun réseau publicitaire ou courtier de données n'est autorisé à installer des traceurs sur vos appareils. Nous ne vendons ni ne monétisons aucune donnée.\n• Confidentialité dès la Conception (Privacy by Design) : Toutes nos fonctionnalités (cartes interactives, visioconférences chiffrées) reposent sur des technologies open-source respectueuses de votre vie privée."
    },
    {
      "id": "sec-4",
      "type": "prose",
      "heading": "4. Catégories de Technologies Utilisées",
      "body": "MyJudicial utilise exclusivement trois catégories transparentes et indispensables :\n\n• Technologies Strictement Nécessaires : Indispensables au fonctionnement fondamental, à l'authentification sécurisée des comptes et à la cybersécurité. Sans elles, l'accès aux espaces clients/avocats et la prise de rendez-vous sont impossibles.\n• Technologies de Préférences et de Localisation : Permettent de mémoriser vos choix exprès : langue d'affichage (anglais, français ou kinyarwanda), thème (clair, sombre ou système) et fuseau horaire de consultation.\n• Technologies Fonctionnelles d'État de Session : Sécurisent temporairement votre navigation, notamment l'ouverture du menu latéral ou la sauvegarde automatique des formulaires d'adhésion pour éviter toute perte accidentelle."
    },
    {
      "id": "sec-5-intro",
      "type": "prose",
      "heading": "5. Inventaire Complet des Cookies HTTP",
      "body": "Le tableau suivant détaille l'ensemble des cookies propriétaires émis par la plateforme MyJudicial :"
    },
    {
      "id": "sec-5-table",
      "type": "table",
      "columns": [
        "Nom du Cookie",
        "Catégorie",
        "Émetteur",
        "Type de Stockage",
        "Durée",
        "Finalité"
      ],
      "rows": [
        [
          "authjs.session-token",
          "Strictement Nécessaire",
          "Propriétaire (MyJudicial)",
          "Cookie HTTP (HttpOnly, Sécurisé)",
          "30 Jours (si Mémorisé) ou 8h-24h (Session)",
          "Gère la session utilisateur authentifiée ; stocke le jeton JWT chiffré contenant l'identifiant, le rôle et les droits d'accès API."
        ],
        [
          "authjs.csrf-token",
          "Strictement Nécessaire",
          "Propriétaire (MyJudicial)",
          "Cookie HTTP (HttpOnly, Sécurisé)",
          "Session de Navigation",
          "Jeton cryptographique protégeant les formulaires d'authentification contre les attaques CSRF (Cross-Site Request Forgery)."
        ],
        [
          "authjs.callback-url",
          "Strictement Nécessaire",
          "Propriétaire (MyJudicial)",
          "Cookie HTTP (HttpOnly, Sécurisé)",
          "Session de Navigation",
          "Mémorise l'URL de redirection après connexion afin de renvoyer l'utilisateur sur la page demandée."
        ],
        [
          "NEXT_LOCALE",
          "Préférences",
          "Propriétaire (MyJudicial / next-intl)",
          "Cookie HTTP",
          "1 An (Persistant)",
          "Conserve le choix de langue de l'utilisateur (en, fr, ou rw) pour garantir la cohérence de l'interface."
        ],
        [
          "sidebar_state",
          "Fonctionnel",
          "Propriétaire (MyJudicial)",
          "Cookie HTTP",
          "7 Jours (max-age=604800)",
          "Mémorise l'état replié ou déployé de la barre latérale de navigation du tableau de bord d'administration."
        ]
      ]
    },
    {
      "id": "sec-6-intro",
      "type": "prose",
      "heading": "6. Inventaire du Stockage Local et de Session (LocalStorage & SessionStorage)",
      "body": "Le tableau suivant répertorie les clés de stockage côté navigateur utilisées par MyJudicial :"
    },
    {
      "id": "sec-6-table",
      "type": "table",
      "columns": [
        "Clé de Stockage",
        "Mécanisme",
        "Catégorie",
        "Durée",
        "Finalité"
      ],
      "rows": [
        [
          "theme",
          "localStorage",
          "Préférences",
          "Persistant jusqu'au nettoyage",
          "Mémorise le thème visuel (clair, sombre ou système) via la librairie next-themes."
        ],
        [
          "mj_lang",
          "localStorage",
          "Préférences",
          "Persistant jusqu'au nettoyage",
          "Cache client du code de langue pour les en-têtes d'appels API et le tri par intelligence artificielle."
        ],
        [
          "mj_timezone",
          "localStorage",
          "Fonctionnel / Préférences",
          "Persistant jusqu'au nettoyage",
          "Enregistre le fuseau horaire du client (par défaut Africa/Kigali) pour le calcul des créneaux de consultation."
        ],
        [
          "expert_onboarding_wizard_data",
          "localStorage",
          "Fonctionnel",
          "Temporaire (effacé lors de la soumission)",
          "Sauvegarde automatique de l'avancement du dossier d'inscription d'avocat pour prévenir toute perte de données."
        ],
        [
          "accessToken / refreshToken",
          "sessionStorage / localStorage",
          "Strictement Nécessaire",
          "Session ou jusqu'à déconnexion",
          "Cache temporaire des jetons d'API REST pour les requêtes authentifiées ; purgé instantanément à la déconnexion."
        ]
      ]
    },
    {
      "id": "sec-7",
      "type": "prose",
      "heading": "7. Services Techniques Tiers et Architecture Zéro Traceur",
      "body": "Nous auditons scrupuleusement tous nos partenaires techniques pour certifier qu'aucun cookie espion n'est déposé sur votre terminal :\n\n• Cartographie Vectorielle MapLibre GL : Notre carte interactive des cabinets d'avocats repose sur MapLibre GL avec tuiles vectorielles hébergées par notre infrastructure, sans cookies Google Maps ni traceurs Mapbox.\n• Visioconférence Sécurisée LiveKit WebRTC : Les consultations virtuelles sont établies via LiveKit Cloud avec WebSockets chiffrés de bout en bout et canaux WebRTC directs. LiveKit ne dépose aucun cookie persistant de pistage.\n• Assistance Juridique par IA : Les demandes d'orientation sont traitées en mémoire vive sur nos microservices sécurisés. Aucune interaction IA ne stocke de cookies publicitaires.\n• Notifications Temps Réel Supabase : Les WebSockets sont utilisés pour les alertes de messagerie en direct sans cookies tiers."
    },
    {
      "id": "sec-8",
      "type": "prose",
      "heading": "8. Base Légale et Consentement selon la Loi N° 058/2021",
      "body": "Base Légale : Conformément à l'article 46 de la loi n° 058/2021, l'utilisation de cookies strictement nécessaires repose sur l'Exécution Contractuelle (art. 46(1)(b)) et l'Intérêt Légitime (art. 46(1)(f)) pour sécuriser nos infrastructures, authentifier les utilisateurs et prévenir la fraude.\n\nPréférences Utilisateur : Les cookies de préférences (langue, thème) sont enregistrés exclusivement en réponse à votre demande active de personnalisation.\n\nPourquoi Aucun Bandeau Intrusif n'est Requis : Dans la mesure où MyJudicial n'utilise AUCUN cookie publicitaire, marketing ou de profilage tiers, les législations rwandaise et internationale n'imposent pas de bandeau bloquant. Si des technologies optionnelles devaient un jour être intégrées, un centre de préférences préalable sera déployé."
    },
    {
      "id": "sec-9",
      "type": "prose",
      "heading": "9. Gestion, Inspection et Désactivation des Cookies",
      "body": "Vous conservez le contrôle total des cookies sur votre appareil. Tous les navigateurs modernes disposent de paramètres permettant de consulter, refuser ou supprimer les cookies :\n\n• Google Chrome : Paramètres → Confidentialité et sécurité → Cookies tiers → Afficher toutes les données et autorisations.\n• Mozilla Firefox : Paramètres → Vie privée et sécurité → Cookies et données de sites → Gérer les données.\n• Apple Safari : Réglages → Safari → Avancé → Confidentialité → Bloquer tous les cookies.\n• Microsoft Edge : Paramètres → Cookies et autorisations de site → Gérer et supprimer les cookies et les données de site.\n\nConséquences du Blocage : Si vous désactivez tous les cookies, vous ne pourrez plus vous connecter à votre compte MyJudicial, réserver une consultation ni effectuer de paiements. La simple consultation publique de l'annuaire restera accessible."
    },
    {
      "id": "sec-10",
      "type": "prose",
      "heading": "10. Modifications de la Politique des Cookies",
      "body": "Nous pouvons réviser cette Politique des Cookies pour tenir compte des évolutions techniques ou légales au Rwanda. La mention « Dernière mise à jour » en haut de ce document sera alors actualisée.\n\nNous vous invitons à la consulter régulièrement pour rester informé de nos pratiques techniques."
    },
    {
      "id": "sec-11",
      "type": "prose",
      "heading": "11. Contact et Délégué à la Protection des Données",
      "body": "Pour toute question relative à cette politique ou pour exercer vos droits légaux selon la loi n° 058/2021, contactez notre bureau de confidentialité :\n\n• Responsable du Traitement : MyJudicial Ltd\n• Délégué à la Protection des Données (DPO) : {{dpoEmail}}\n• Support Client : {{supportEmail}}\n• Téléphone Hotline : {{hotlinePhone}}\n• Siège Social : {{officeAddress}}\n• Boîte Postale : {{poBox}}\n• Heures d'Ouverture : {{workingHours}}\n\nPour la protection générale de vos données, consultez notre Politique de Confidentialité."
    }
  ],
  "status": "published",
  "locale": "fr",
  "effectiveDate": "1er octobre 2026",
  "metaTitle": "Politique relative aux Cookies | MyJudicial",
  "metaDescription": "Inventaire transparent des cookies HTTP et technologies de stockage employées par MyJudicial conformément à la loi rwandaise n° 058/2021."
},
  {
    "slug": "ABOUT",
    "title": "Rapprocher la justice de chaque citoyen rwandais",
    "blocks": [
      {
        "id": "hero-subtitle",
        "type": "prose",
        "body": "MyJudicial est la première plateforme légale numérique du Rwanda reliant les particuliers et les entreprises à des avocats certifiés par le Barreau du Rwanda."
      },
      {
        "id": "mission",
        "type": "prose",
        "body": "Démocratiser l'accès à la justice et aux conseils juridiques qualifiés au Rwanda grâce à une technologie transparente, accessible et sécurisée.",
        "heading": "Notre mission"
      },
      {
        "id": "vision",
        "type": "prose",
        "body": "Un Rwanda où chaque citoyen, entrepreneur et organisation bénéficie d'une protection juridique équitable et immédiate sans complications.",
        "heading": "Notre vision"
      },
      {
        "id": "story",
        "type": "prose",
        "body": "Rapprocher le droit et les citoyens rwandais grâce à la confiance, la technologie et la clarté.\n\nLe Défi Juridique au Rwanda\n\nFondée à Kigali, MyJudicial est née du constat que trouver un avocat qualifié et disponible était complexe, opaque et intimidant pour la majorité des citoyens.\n\nL'Infrastructure Juridique Numérique\n\nNous avons développé un pont numérique conforme aux régulations rwandaises permettant des consultations vérifiées, avec tarification claire et paiement sécurisé via Mobile Money.",
        "heading": "Notre histoire"
      },
      {
        "id": "verification-intro",
        "type": "prose",
        "body": "Chaque avocat de la plateforme passe un contrôle documenté et audité avant la publication de son profil.",
        "heading": "Le protocole de vérification des avocats en 4 étapes"
      },
      {
        "id": "verification-1",
        "type": "prose",
        "body": "Une pièce d'identité officielle et une licence en cours de validité délivrée par le Barreau du Rwanda (RBA) sont recueillies et contrôlées par notre équipe avant la création du profil.",
        "heading": "Vérification d'identité et de licence"
      },
      {
        "id": "verification-2",
        "type": "prose",
        "body": "Les informations d'inscription sont recoupées avec le Tableau officiel des avocats du Barreau du Rwanda afin de confirmer la qualité d'avocat inscrit.",
        "heading": "Recoupement avec le registre officiel"
      },
      {
        "id": "verification-3",
        "type": "prose",
        "body": "Les avocats s'engagent sur des honoraires fixes publiés, les conditions du séquestre et le code de conduite de la plateforme avant de proposer des consultations.",
        "heading": "Revue de conduite et des honoraires"
      },
      {
        "id": "verification-4",
        "type": "prose",
        "body": "Une revue humaine finale approuve le profil mis en ligne. Chaque étape du processus est consignée dans un journal d'audit.",
        "heading": "Revue humaine finale"
      },
      {
        "id": "core-values",
        "type": "coreValues",
        "heading": "Nos valeurs fondamentales",
        "values": [
          {
            "id": "access",
            "title": "Accessibilité",
            "description": "Le droit doit être compréhensible et accessible à tous, sans barrières financières imprévues ni démarches opaques.",
            "icon": "Users"
          },
          {
            "id": "transparency",
            "title": "Transparence",
            "description": "Honoraires fixes, identité certifiée par le Barreau et avis de clients réels avant chaque engagement.",
            "icon": "Scale"
          },
          {
            "id": "trust",
            "title": "Confiance & Sécurité",
            "description": "Paiements retenus sous séquestre jusqu'à la tenue effective de la consultation et confidentialité absolue de vos données.",
            "icon": "ShieldCheck"
          },
          {
            "id": "compliance",
            "title": "Secret Professionnel & Données",
            "description": "Conformité stricte avec la Loi n° 058/2021 sur la protection des données personnelles, avec des consultations chiffrées protégeant le secret d'avocat.",
            "icon": "Lock"
          }
        ]
      },
      {
        "id": "milestones",
        "type": "milestones",
        "heading": "Notre parcours",
        "items": [
          {
            "id": "m-1",
            "year": "2024",
            "title": "L'idée",
            "description": "MyJudicial part d'un constat simple : trouver un avocat au Rwanda ne devrait être ni opaque, ni lent, ni intimidant."
          },
          {
            "id": "m-2",
            "year": "2025",
            "title": "Vérification et séquestre",
            "description": "Le protocole de vérification des avocats et le paiement sous séquestre sont construits, de sorte que justificatifs et paiements soient protégés par défaut."
          },
          {
            "id": "m-3",
            "year": "2026",
            "title": "Un marché ouvert",
            "description": "Une plateforme publique trilingue voit le jour, avec consultations vidéo sécurisées et triage des dossiers assisté par IA pour les clients de tout le Rwanda."
          }
        ]
      },
      {
        "id": "governance-intro",
        "type": "prose",
        "body": "Des règles claires qui garantissent un marché équitable pour les clients comme pour les avocats.",
        "heading": "Gouvernance institutionnelle et éthique"
      },
      {
        "id": "governance-1",
        "type": "prose",
        "body": "Les honoraires versés sont conservés sous séquestre et reversés à l'avocat uniquement lorsque la consultation est terminée, ou remboursés en cas d'annulation.",
        "heading": "Décaissement du séquestre uniquement à la fin"
      },
      {
        "id": "governance-2",
        "type": "prose",
        "body": "Les honoraires publiés sont fixes et liés à une seule consultation. Aucun frais caché ; les litiges sont traités selon une procédure documentée.",
        "heading": "Un forfait, une consultation"
      },
      {
        "id": "governance-3",
        "type": "prose",
        "body": "Les consultations sont privées, réservées aux participants attendus et jamais enregistrées. Les données sont traitées conformément à la loi rwandaise n° 058/2021.",
        "heading": "Confidentialité par conception"
      },
      {
        "id": "ecosystem-intro",
        "type": "prose",
        "body": "MyJudicial collabore avec des institutions reconnues au Rwanda pour garantir des normes d'excellence et une exécution rigoureuse du séquestre.",
        "heading": "Conçu avec les Institutions Juridiques & Financières du Rwanda"
      },
      {
        "id": "ecosystem-legal",
        "type": "prose",
        "body": "Recoupement avec le Tableau officiel de l'Ordre des Avocats du Rwanda. La validité du droit d'exercice de chaque avocat est systématiquement contrôlée.",
        "heading": "Cadre Légal & Barreau du Rwanda"
      },
      {
        "id": "ecosystem-financial",
        "type": "prose",
        "body": "Intégration directe avec MTN MoMo, Airtel Money et des comptes de séquestre bancaires agréés pour garantir la protection totale des fonds.",
        "heading": "Séquestre Financier & Mobile Money"
      },
      {
        "id": "ecosystem-regulatory",
        "type": "prose",
        "body": "Fonctionnement en stricte conformité avec la Loi n° 058/2021 relative à la protection des données personnelles et de la vie privée au Rwanda.",
        "heading": "Conformité Légale & Protection des Données"
      },
      {
        "id": "ecosystem-cta",
        "type": "callout",
        "heading": "Partenariats Institutionnels",
        "body": "Vous êtes une institution juridique, une ONG ou un partenaire institutionnel souhaitant collaborer ?",
        "tone": "info"
      },
      {
        "id": "disclaimer",
        "type": "callout",
        "heading": "Mention Réglementaire",
        "body": "MyJudicial est une plateforme technologique indépendante mettant en relation les justiciables avec des avocats inscrits au Barreau du Rwanda. MyJudicial n'est pas un cabinet d'avocats et ne fournit pas directement de conseils juridiques.",
        "tone": "warning"
      }
    ],
    "status": "draft",
    "locale": "fr"
  },
  {
    "slug": "CAREERS",
    "title": "Bâtir l'avenir des services juridiques accessibles",
    "blocks": [
      {
        "id": "hero-subtitle",
        "type": "prose",
        "body": "MyJudicial est une place de marché qui met en relation les clients rwandais avec des praticiens du droit, dont les justificatifs sont examinés avant la mise en ligne de leur profil. Le produit est encore jeune, et une grande partie reste à construire."
      },
      {
        "id": "why-intro",
        "type": "prose",
        "body": "Travailler sur un logiciel qui répond à un problème ordinaire : trouver et payer un avocat quand on n'a ni recommandation ni idée de ce que cela devrait coûter.",
        "heading": "Pourquoi construire avec MyJudicial"
      },
      {
        "id": "why-access",
        "type": "prose",
        "body": "Une personne hors de Kigali, sans recommandation, peut chercher par domaine et par localisation, voir le forfait de la consultation avant de s'engager, et lire le site dans sa langue.",
        "heading": "Accès universel à la justice"
      },
      {
        "id": "why-transparency",
        "type": "prose",
        "body": "Les honoraires de consultation sont publiés à l'avance, et non négociés au cas par cas. Un montant payé est rattaché à une consultation précise dans un registre de séquestre interne, puis libéré ou remboursé au regard de cette réservation.",
        "heading": "Transparence des tarifs"
      },
      {
        "id": "why-verification",
        "type": "prose",
        "body": "Chaque avocat fournit une pièce d'identité et un certificat du barreau. Notre équipe de revue examine chaque dossier à la main avant la mise en ligne du profil, et chaque décision est tracée. Les numéros du barreau ne sont pas vérifiés auprès du registre officiel du barreau.",
        "heading": "Justificatifs examinés"
      },
      {
        "id": "why-impact",
        "type": "prose",
        "body": "Le travail se mesure à ceci : une personne peut-elle trouver un avocat, comprendre le prix, et avancer dans une affaire sans connaître personne dans le métier.",
        "heading": "Impact local concret"
      },
      {
        "id": "workon-intro",
        "type": "prose",
        "body": "Les systèmes qui portent la plateforme, y compris ceux qui ne sont pas terminés.",
        "heading": "Ce sur quoi nous travaillons"
      },
      {
        "id": "workon-marketplace",
        "type": "prose",
        "body": "Recherche par carte et par texte, avec des filtres par domaine, fourchette de prix, note, expérience et disponibilité, sur une dizaine de domaines nommés.",
        "heading": "Place de marché & recherche"
      },
      {
        "id": "workon-payments",
        "type": "prose",
        "body": "Paiement mobile via un agrégateur, registre de séquestre qui retient un montant payé face à une consultation, remboursements en cas d'annulation et suivi des revenus des experts. Le versement réel, le paiement par carte et la gestion des litiges ne sont pas encore construits.",
        "heading": "Paiements & infrastructure de service"
      },
      {
        "id": "workon-ai",
        "type": "prose",
        "body": "Une personne décrit sa situation juridique avec ses propres mots et reçoit le domaine probable, le degré d'urgence, une fourchette de coût et des avocats correspondants.",
        "heading": "Triage juridique assisté par IA"
      },
      {
        "id": "workon-video",
        "type": "prose",
        "body": "Appels dans le navigateur via WebRTC, avec un accès à la salle limité aux deux participants réservés et aucun enregistrement de la session. Le chiffrement de bout en bout au niveau des images n'est pas activé aujourd'hui.",
        "heading": "Consultations vidéo privées"
      },
      {
        "id": "workon-verification",
        "type": "prose",
        "body": "Les pièces d'identité et les certificats du barreau sont chiffrés au repos, transmis uniquement au chargé de traitement concerné, et chaque action de revue est inscrite dans un journal d'audit.",
        "heading": "Revue des justificatifs"
      },
      {
        "id": "workon-localization",
        "type": "prose",
        "body": "Le produit public est disponible en kinyarwanda, en anglais et en français. La couverture reste inégale à travers le produit, et c'est un travail en cours.",
        "heading": "Produit trilingue"
      },
      {
        "id": "how-intro",
        "type": "prose",
        "body": "Quelques principes que nous utilisons réellement pour décider.",
        "heading": "Comment nous travaillons"
      },
      {
        "id": "how-p1",
        "type": "prose",
        "body": "Un changement vaut la peine s'il réduit la friction, la confusion ou l'intimidation pour quelqu'un qui cherche une aide juridique. Sinon, il ne devrait probablement pas être livré.",
        "heading": "L'utilisateur d'abord"
      },
      {
        "id": "how-p2",
        "type": "prose",
        "body": "Les affaires juridiques sont sensibles. Nous prenons au sérieux la vie privée, la sécurité et le soin apporté aux informations, et notre politique de confidentialité détaille ce que nous collectons et pourquoi.",
        "heading": "Concevoir de manière responsable & protéger la vie privée"
      },
      {
        "id": "how-p3",
        "type": "prose",
        "body": "Quand quelque chose n'est pas terminé, nous le disons. Nous préférons être exacts sur ce que le produit fait plutôt que brillants sur ce qu'il pourrait faire.",
        "heading": "La confiance par l'exactitude"
      },
      {
        "id": "how-p4",
        "type": "prose",
        "body": "Nous privilégions ce qui fonctionne sur un téléphone ordinaire et un réseau ordinaire au Rwanda plutôt que ce qui ne fonctionne qu'en démonstration.",
        "heading": "Résoudre de vrais problèmes"
      },
      {
        "id": "jobs",
        "type": "jobs"
      },
      {
        "id": "faq-1",
        "type": "prose",
        "body": "MyJudicial est basé à Kigali, au Rwanda.",
        "heading": "Où est situé MyJudicial ?"
      },
      {
        "id": "faq-2",
        "type": "prose",
        "body": "Oui. Écrivez à l'adresse recrutement indiquée sur cette page. Un membre de l'équipe le lit. Rien à votre sujet n'est enregistré sur ce site : si vous souhaitez relancer, répondez au message que vous avez envoyé.",
        "heading": "Puis-je vous contacter s'il n'y a aucun poste ouvert ?"
      },
      {
        "id": "faq-3",
        "type": "prose",
        "body": "Une courte présentation, votre CV, des liens vers des travaux dont vous êtes fier, et les parties de la plateforme sur lesquelles vous aimeriez travailler.",
        "heading": "Que dois-je inclure ?"
      },
      {
        "id": "faq-4",
        "type": "prose",
        "body": "Le produit public est disponible en kinyarwanda, en anglais et en français. La couverture n'est pas encore complète sur tous les écrans.",
        "heading": "Quelles langues MyJudicial prend-il en charge ?"
      },
      {
        "id": "cta",
        "type": "callout",
        "heading": "Envie de construire avec nous ?",
        "body": "Dites-nous sur quoi vous aimeriez travailler, ou allez voir ce que MyJudicial fait aujourd'hui.\n\nEnvoyer une manifestation d'intérêt",
        "tone": "info"
      }
    ],
    "status": "draft",
    "locale": "fr"
  },
  {
    "slug": "CONTACT",
    "title": "Nous Sommes à Votre Écoute",
    "blocks": [
      {
        "id": "hero-subtitle",
        "type": "prose",
        "body": "Notre équipe d'opérations juridiques à Kigali est disponible pour accompagner les justiciables, vérifier les avocats ou établir des partenariats institutionnels."
      },
      {
        "id": "departments",
        "type": "prose",
        "body": "Assistance Citoyens & Clients — Aide pour les réservations, salons vidéo sécurisés LiveKit et questions sur le séquestre Mobile Money/Airtel. (support@myjudicial.com)\n\nVérification & Tableau du Barreau — Vérification des titres du Barreau du Rwanda, intégration des profils professionnels et reversements. (support@myjudicial.com)\n\nPartenariats Institutionnels — Collaborations avec les barreaux, programmes d'accès au droit d'ONG et infrastructures juridiques d'entreprise. (support@myjudicial.com)",
        "heading": "Coordonnées Officielles"
      },
      {
        "id": "office",
        "type": "prose",
        "body": "Centenary House, 4e Étage, KN 3 Ave & KN 4 St\n\nQuartier d'Affaires de Nyarugenge, Kigali, Rwanda\n\nAdjacent au Tribunal de Commerce de Nyarugenge\n\nHeures d'Ouverture: Lundi – Vendredi : 08h00 – 18h00 (CAT)",
        "heading": "Siège Social de Kigali"
      },
      {
        "id": "channels",
        "type": "callout",
        "heading": "E-mail",
        "body": "support@myjudicial.com\n\n+250 788 312 456",
        "tone": "info"
      },
      {
        "id": "contact-card",
        "type": "contactCard"
      },
      {
        "id": "self-service",
        "type": "prose",
        "body": "Accédez à notre annuaire d'avocats vérifiés et à notre centre d'aide sans délai d'attente.\n\nTrouver un Avocat Vérifié: Consultez plus de 100 avocats inscrits au Barreau du Rwanda, avec expérience judiciaire attestée et honoraires transparents.\n\nTarifs Fixes & Séquestre Garanti: Découvrez comment vos paiements MoMo et Airtel sont conservés sous séquestre sécurisé jusqu'au terme de votre consultation.\n\nCentre d'Aide & Questions Fréquentes: Guides pas à pas sur les réservations, le dépôt de titres fonciers UPI et l'accès aux salons vidéo chiffrés.",
        "heading": "Besoin d'une Réponse ou d'un Avocat Immédiat ?"
      }
    ],
    "status": "draft",
    "locale": "fr"
  },
  {
    "slug": "TERMS",
    "title": "Amabwiriza Ngenderwaho yo Gukoresha Urubuga",
    "blocks": [
      {
        "id": "sec-1",
        "type": "prose",
        "body": "Mu gukoresha cyangwa kwinjira muri Serivisi, wemera kuyoborwa n'aya mabwiriza hamwe na Politiki y'Ibanga yacu. Niba utabyemera, ntukoreshe Serivisi.",
        "heading": "1. Kwemera amabwiriza"
      },
      {
        "id": "sec-2",
        "type": "prose",
        "body": "Kugira ngo wigere ku bimwe mubikorwa bya Serivisi, ugomba gukora konti. Ushinzwe kurinda amakuru y'urufunguzo rwawe ndetse n'ibikorwa byose bikorerwa kuri konti yawe. Ugomba kuba ufite nibura imyaka 18 kugira ngo ukore konti.",
        "heading": "2. Konti z'abakoresha"
      },
      {
        "id": "sec-3",
        "type": "prose",
        "body": "MyJudicial ni urubuga ruhuza abakiriya n'umwuga w'amategeko. Ntabwo dutanga inama z'amategeko twebwe ubwacu. Iyo ufashe gahunda, ubwishyu burindwa mu buryo bwizewe (escrow) kandi buhabwa umwavoka gusa nyuma yo kurangiza ubujyanama.",
        "heading": "3. Isoko n'Eskaro"
      },
      {
        "id": "sec-4",
        "type": "prose",
        "body": "Serivisi zatanzwe « NKO ZIRI » kandi « MUKO ZIHARI ». Ntitwemera ikigamiro icyo ari cyo cyose, mu buryo bunaka cyangwa busa, harimo amasezerano asigurwa y'ubucuruzi, gukenera ikintu runaka cyangwa kutabangamira.",
        "heading": "4. Imyitwarire iburira"
      }
    ],
    "status": "published",
    "locale": "rw"
  },
  {
    "slug": "PRIVACY",
    "title": "Politiki y'Ibanga",
    "blocks": [
      {
        "id": "sec-1",
        "type": "prose",
        "heading": "1. Abo turi bo n'Ushinzwe Kugenzura Amakuru",
        "body": "MyJudicial Ltd (\"MyJudicial\", \"twebwe\", cyangwa \"byacu\") ni urubuga rw'ikoranabuhanga rya mbere mu Rwanda ruhuza abaturage, abashoramari n'inzego z'ubucuruzi n'abavoka n'impuguke mu by'amategeko bemewe kandi bagenzuwe. Mu rwego rw'Itegeko nº 058/2021 ryo ku wa 13/10/2021 ryerekeye kurinda amakuru bwite n'ubuzima bwite bw'umuntu, MyJudicial niyo igenzura amakuru (Data Controller) atunganywa binyuze ku rubuga rwacu (myjudicial.com) na serivisi zijyanye na rwo.\n\nIbiro bikuru byacu biherereye muri Centenary House, Etaji ya 4, KN 3 Ave & KN 4 St, Nyarugenge Central Business District, P.O. Box 2848, Kigali, Rwanda. Twashyizeho Umukozi ushinzwe Kurinda Amakuru (DPO) ushobora kubonwa kuri imeri legal@myjudicial.com ku bibazo byose byerekeye uburenganzira bwite n'iyubahirizwa ry'amategeko."
      },
      {
        "id": "sec-2",
        "type": "prose",
        "heading": "2. Ibyo Iyi Politiki Ireba",
        "body": "Iyi Politiki y'Ibanga igenga ikusanywa, itunganywa n'irindwa ry'amakuru bwite muri serivisi zose za MyJudicial, zirimo:\n\n• Gushakisha abavoka, gukoresha ikarita y'aho bakorera, no gusura imyirondoro yabo;\n• Kuzuza ifishi y'ikibazo cy'amategeko no gukoresha ubufasha bwa AI mu kumenya ibyiciro by'ikibazo;\n• Guhitamo igihe cyo guhura n'umwunganizi no gukoresha amashusho (LiveKit video);\n• Uburyo bwo kubika amafaranga y'ubujyanama mu buryo bwizewe (escrow) kugeza serivisi irangiye;\n• Ububiko bw'inyandiko z'ibanga zifunze n'imfunguzo z'ikoranabuhanga (OCI Object Storage);\n• Kumenyekanisha imyirondoro no kugenzura ibyangombwa by'abavoka bo mu Rugaga rw'Abavoka.\n\nIkitonderwa: Iyi politiki ireba ibikorwa by'ikoranabuhanga bya MyJudicial. Iyo ushyize umukono ku masezerano yo kwunganirwa n'umwavoka mu nkiko cyangwa mu zindi nzego, uwo mwavoka agengwa n'amahame y'umwuga w'ubuvoka n'ibanga ry'umwuga (professional secrecy) by'Urugaga rw'Abavoka mu Rwanda."
      },
      {
        "id": "sec-3",
        "type": "prose",
        "heading": "3. Amakuru Dukusanya",
        "body": "Dukusanya gusa amakuru bwite akenewe kugira ngo dusohoze inshingano z'urubuga rwacu. Amakuru akusanywa agabanyije muri ibi byiciro bikurikira:\n\n• Amakuru y'Umwirondoro no Kwinjira: Amazina nyakuri, imeri, nimero ya telefoni, ijambobanga rifunze (Argon2/bcrypt), konti za Google/LinkedIn zikoreshwa mu kwinjira, ururimi uhitamo, n'icyiciro cyawe (Umuturage, Impuguke, Umuyobozi).\n• Amakuru y'Umwuga w'Abavoka: Amazina akoresha mu mwuga, amateka y'akazi, ibiro akoreramo, aderesi, nimero yo mu Rugaga rw'Abavoka (RBA Roll), icyemezo cyo gukora ubuvoka gifite agaciro, kopi y'indangamuntu cyangwa pasiporo, impamyabumenyi, ibyiciro by'amategeko akoreramo, ibiciro by'ubujyanama, na nimero ya Mobile Money yishyurirwaho.\n• Amakuru yo Guhura n'Ubujyanama: Ubwoko bwa serivisi, uburyo bwo guhura (amashusho, telefoni, guhura imbona nkubone), itariki n'isaha, inyandiko ngufi z'ikibazo, nimero y'icyumba cyo guhuriramo (meeting room ID), n'amateka yo gusubika cyangwa guhagarika.\n• Ubutumwa Bwo ku Rubuga: Ubutumwa bwandikiranwa hagati y'umukiriya n'umwunganizi, inyandiko zometseho (PDF, amasezerano, inyandiko z'urukiko), n'igihe ubutumwa bwagereye n'aho bwasomewe.\n• Inyandiko zo mu Bubiko Bw'Ibanga: Inyandiko z'imanza, amasezerano, n'ibimenyetso bishyirwa mu bubiko bw'ikoranabuhanga (Vault) bwo muri OCI, bikaba bifunze n'ingufuri ya AES-256-GCM ku buryo nta wundi ushobora kubibona.\n• Amakuru y'Imari n'Ubwishyu: Nimero z'ubwishyu (txRef), nimero zikoreshwa muri MTN Mobile Money na Airtel Money binyuze muri AzamPay, amafaranga yabitswe muri escrow, n'amafaranga yishyuwe umwavoka. MyJudicial NTIBIKA nimero z'amakarita ya banki cyangwa imibare y'ibanga (PIN) ya Mobile Money.\n• Amakuru y'Ubusesenguzi bwa AI: Ibisobanuro by'ikibazo byanditswe cyangwa byavuzwe mu ijwi, inyandiko yakuwe mu ijwi ikorwa mu kanya gato, ubwoko bw'amategeko ikibazo kibarizwamo, ubwihutirwe, n'ingengo y'imari igenekerejwe.\n• Amakuru y'Aho Uherereye: Imyirondoro y'aho uherereye (GPS) isabwa gusa igihe ushaka abavoka bakwegereye ku ikarita (iyo bidakozwe hafatwa Kigali CBD: -1.9441, 30.0619); n'aho ibiro by'abavoka biherereye.\n• Amakuru y'Ikoranabuhanga na Raporo z'Umutekano: Aderesi ya IP, amakuru ya porogaramu ukoresha (browser), igihe winjiriye, na raporo z'umutekano (AuditLog) zigaragaza ibikorwa bikomeye byakozwe ku rubuga."
      },
      {
        "id": "sec-4",
        "type": "prose",
        "heading": "4. Uko Dukusanya Amakuru Yawe",
        "body": "Dukusanya amakuru bwite binyuze mu buryo busobanutse kandi bwemewe n'amategeko:\n\n• Utwibwiriye ubwawe: Igihe wiyandikisha ku rubuga, wuzuza imyirondoro, usobanura ikibazo cyawe mu ifishi, ushyira inyandiko mu bubiko, wandikira umwunganizi, cyangwa wishyura ubujyanama.\n• Bikozwe n'ikoranabuhanga mu buryo bwikora: Mu gihe ukoresha urubuga, dukusanya amakuru y'ibanze y'ikoranabuhanga (cookies, aderesi ya IP, amakuru ya mudasobwa cyangwa telefoni) kugira ngo urubuga rukore neza kandi rufite umutekano.\n• Amakuru atangwa n'abavoka: Igihe abavoka basaba gukorera kuri MyJudicial, batanga ibyangombwa by'umwuga, impamyabumenyi, n'amasaha babonekaho.\n• Igenzura ry'inzego zibifitiye ububasha: Itsinda ryacu rishinzwe igenzura risuzuma ibyangombwa byatanzwe ribigereranya n'Urutonde rw'Abavoka bemewe rwatangajwe n'Urugaga rw'Abavoka mu Rwanda."
      },
      {
        "id": "sec-5",
        "type": "prose",
        "heading": "5. Impamvu n'Uburyo Dukoresha Amakuru Yawe",
        "body": "MyJudicial ikoresha amakuru bwite ku mpamvu zizwi, zemewe n'amategeko kandi zisobanutse neza gusa:\n\n• Gucunga urubuga no gufasha abakoresha kwinjira: Kwandika abakoresha bashya, gucunga imyirondoro, no kugenzura uburenganzira bw'abinjira muri buri cyiciro.\n• Kugenzura abavoka no kurinda uburiganya: Gusuzuma niba umwavoka yanditse mu Rugaga, kurinda ko hari abiyitirira ubuvoka, no kurengera abaturage bashaka ubutabera.\n• Gutegura gahunda z'ubujyanama no guhura mu buryo bw'amashusho: Gushyiraho gahunda yo guhura, guhuza za kalendari, no gufungura ibyumba by'amashusho byizewe (LiveKit).\n• Gucunga amafaranga mu buryo bwizewe (Escrow): Kubika amafaranga y'ubujyanama kugeza serivisi irangiye neza, no kuyashyikiriza umwavoka kuri Mobile Money.\n• Serivisi y'Ububiko bw'Inyandiko z'Ibanga (Vault): Kubika mu buryo bufunze kandi bwizewe inyandiko z'imanza n'amasezerano muri OCI.\n• Gusesengura ikibazo no gushaka abavoka bakwiye hifashishijwe AI: Gutahura mu kanya gato urwego rw'amategeko ikibazo kibarizwamo, ubwihutirwe, no kumenya abavoka babyigiye.\n• Kohereza ubutumwa bw'ingenzi bwa serivisi: Kohereza ubutumwa bubutsa gahunda, imibare y'umutekano (OTP), inyemezabwishyu n'ubutumwa bwa serivisi binyuze kuri SMS na imeri (Brevo).\n• Umutekano w'urubuga, kugenzura ibikorwa no kubahiriza amategeko: Gutahura ibitero by'ikoranabuhanga, gukemura impaka, kubika raporo z'umutekano (AuditLog), no gutanga raporo ziteganywa n'amategeko y'u Rwanda."
      },
      {
        "id": "sec-6",
        "type": "prose",
        "heading": "6. Ishingiro ry'Amategeko ryo Gutunganya Amakuru (Itegeko nº 058/2021)",
        "body": "Hifashishijwe Ingingo ya 46 y'Itegeko ry'u Rwanda nº 058/2021 ryerekeye kurinda amakuru bwite n'ubuzima bwite bw'umuntu, MyJudicial itunganya amakuru yawe yisunze ibi bishingiro bikurikira:\n\n• Gusohoza amasezerano (Ingingo ya 46(1)(b)): Itunganywa ry'amakuru ni ngombwa kugira ngo dusohoze amasezerano y'imikoranire twagiranye nawe (amabwiriza y'urubuga, gufata gahunda y'ubujyanama, kubika amafaranga muri escrow, no gukoresha ububiko bw'inyandiko).\n• Kubahiriza inshingano z'amategeko (Ingingo ya 46(1)(c)): Amategeko y'ubucuruzi mu Rwanda, kubika inyandiko z'ibaruramari, kurwanya iyezandonke, gutanga umusoro mu Kigo cy'Imisoro n'Amahoro (RRA), no kubahiriza amabwiriza y'inkiko z'u Rwanda.\n• Inyungu zemewe n'amategeko (Ingingo ya 46(1)(f)): Inyungu z'ubucuruzi bwemewe za MyJudicial n'iz'abakoresha urubuga—by'umwihariko kugenzura niba abavoka banditse ku Rutonde rw'Urugaga, gukumira uburiganya, kurinda umutekano w'urubuga, no kubika inyandiko z'ibyakozwe (AuditLog)—igihe cyose bitabangamiye uburenganzira bwawe shingiro.\n• Uburenganzira butanzwe na nyir'ubwite (Ingingo ya 46(1)(a)): Ku bintu bimwe na bimwe bitari itegeko, tugusaba uburenganzira busobanutse, nko gutanga amakuru y'aho uherereye kugira ngo ubone abavoka bakwegereye, cyangwa gukoresha ijwi mu kwandika ikibazo cyawe hifashishijwe AI. Ushobora guhagarika ubu burenganzira igihe icyo ari cyo cyose."
      },
      {
        "id": "sec-7",
        "type": "prose",
        "heading": "7. Abahabwa Amakuru n'Uko Asangizwa",
        "body": "Ntabwo ducuruza, ntitukodesha, kandi ntitugurisha amakuru yawe bwite na rimwe. Amakuru asangizwa gusa ibi byiciro bikurikira byateganyijwe:\n\n• Abavoka wahisemo kugisha inama: Iyo ufashe gahunda yo kugisha inama umwavoka, amakuru yawe, incamake y'ikibazo, n'inyandiko wageneye uwo mwavoka bimugeraho mu buryo butaziguye.\n• Abafatanyabikorwa mu by'ikoranabuhanga n'ububiko bwo mu bicu:\n  - Ububiko bw'amakuru n'imyirondoro: Supabase / Amazon Web Services (AWS).\n  - Ububiko bufunze bw'inyandiko (Vault): Oracle Cloud Infrastructure (OCI) hamwe n'uburyo bwo gucunga imfunguzo za KMS.\n  - Amashusho yo kugisha inama mu buryo bw'ako kanya: LiveKit Cloud ikoresha uburyo bwa WebRTC bufite umutekano ukomeye.\n  - Kohereza ubutumwa: Brevo ikoreshwa mu kohereza imeri na SMS zibutsa gahunda cyangwa zitanga imibare y'umutekano (OTP).\n  - Kubika amakuru akenerwa vuba: Upstash Redis.\n  - Kumenyekanisha no kwishyura amafaranga: AzamPay ifasha mu kwakira no kwishyura amafaranga ya Mobile Money.\n• Urugaga rw'Abavoka mu Rwanda: Igihe bikenewe mu gusuzuma niba umwavoka yemewe cyangwa mu gukurikirana imyitwarire ye mu mwuga.\n• Inkiko n'Inzego z'Ubutabera: Igihe gusa bitetswe n'icyemezo cy'urukiko cyangwa itegeko ryatanzwe n'inzego z'ubutabera zibifitiye ububasha mu Rwanda."
      },
      {
        "id": "sec-8",
        "type": "prose",
        "heading": "8. Ibanga ry'Umwuga w'Ubuvoka no Kwizerana",
        "body": "Ibanga ry'umwuga w'ubuvoka (Professional Secrecy): Mu mategeko y'u Rwanda no mu mahame agenga Urugaga rw'Abavoka, amakuru n'inyandiko uhereza umwavoka mu gihe umugisha inama bigengwa n'ibanga rikomeye ry'umwuga (secret professionnel). Umwavoka ugishije inama afite inshingano ikomeye yo kutamena ibanga ku byo wamubwiye byose.\n\nIngamba z'umutekano ku rubuga: MyJudicial yubatse mu buryo bwubahiriza iri banga ry'umwuga. Inyandiko zishyirwa mu bubiko bw'ibanga (Vault) zifungwa n'ingufuri ya AES-256-GCM ku buryo n'abakozi ba MyJudicial ubwabo badashobora kuzisoma cyangwa kureba ubutumwa ugirana n'umwavoka, keretse gusa igihe habayeho ikibazo cy'ikoranabuhanga gikenera gukemurwa kandi bikagenzurwa n'amategeko, cyangwa hateganyijwe n'icyemezo cy'urukiko."
      },
      {
        "id": "sec-9",
        "type": "prose",
        "heading": "9. Imikoreshereze ya AI n'Umutekano wayo",
        "body": "MyJudicial ikoresha ikoranabuhanga rya AI (myjudicial-ai-service) mu gufasha abaturage gusobanukirwa ibyiciro by'ibibazo byabo:\n\n• Guhindura ijwi mu nyandiko (Whisper): Iyo ufashe amajwi usobanura ikibazo cyawe, porogaramu ya Whisper ihindura iryo jwi mu magambo mu kanya gato. Iryo jwi ntiriguma ku rubuga nyuma yo kwandikwa.\n• Gutahura urwego rw'amategeko: Porogaramu yacu isesengura amagambo (Ollama Qwen2.5 cyangwa cloud yizewe) isuzuma ikibazo cyawe kugira ngo imenye niba kireba amategeko y'ubutaka, umuryango, ubucuruzi, cyangwa ibindi, ndetse ikerekana niba cyihutirwa.\n• Gushakisha umwavoka uhuye n'ikibazo: Amagambo asobanura ikibazo ahindurwamo imibare y'ikoranabuhanga (embeddings) ifasha kubona umwavoka ufite ubunararibonye mu bibazo nk'ibyo.\n• NTA MAKURU AKORESHWA MU KWIGISHA AI: Amakuru y'ibibazo byawe, inyandiko ushyiraho, amajwi wafashe, n'ibiganiro ugirana n'abavoka NTIBYIGISHWA cyangwa ngo bikoreshwe mu kunoza porogaramu za AI z'abandi.\n• Ubufasha bwo kuyobora gusa: Ibyo AI yerekana ni ibitekerezo byo kukuyobora ku mwunganizi ukwiye. AI ntabwo itanga inama z'amategeko zemewe kandi ntishobora gusimbura umwavoka wemewe n'amategeko."
      },
      {
        "id": "sec-10",
        "type": "prose",
        "heading": "10. Imyanzuro Yikora no Guhitamo Abavoka ku Urubuga",
        "body": "NTA MYANZURO Y'AMATEGEKO IFATWA N'IKORANABUHANGA MU BURYO BWIKORA: MyJudicial ntabwo ifata imyanzuro yikora ifite ingaruka z'amategeko ku mukoresha (nk'urugero gufunga konti mu buryo bwikora cyangwa kumwima serivisi bitanyuze mu muntu).\n\nUburyo bwo gutoranya no gushyira ku murongo abavoka: Iyo ushakishije abavoka, urubuga rukoresha uburyo busobanutse bw'imibare mu kubashyira ku murongo ukurikije:\n\n1. Guhura kw'ikibazo n'ubumenyi bw'umwavoka (40%): Uko ikibazo cyawe gihuye n'ubumenyi umwavoka afite;\n2. Amanota yahawe n'abandi bakiriya (25%): Amanota umwavoka yahawe n'abamugishije inama mbere;\n3. Guhuza n'ingengo y'imari (15%): Uko ibiciro by'umwavoka bihuye n'amafaranga wifuza gukoresha;\n4. Umubare w'abatanze amanota (10%): Umubare w'abakiriya bamaze kumugisha inama bakamuha amanota;\n5. Imyaka y'ubunararibonye (5%): Igihe amaze akora umwuga w'ubuvoka mu Rugaga;\n6. Ishami ry'amategeko akoramo cyane (5%): Niba amategeko y'ikibazo ariyo asanzwe yibandaho cyane.\n\nUburenganzira bwawe bwo guhitamo: Ubu buryo bukoreshwa gusa mu kugufasha kubona abavoka ku murongo. Ufite uburenganzira bwuzuye bwo guhitamo umwavoka uwo ari we wese ushaka kuri uru rubuga."
      },
      {
        "id": "sec-11",
        "type": "prose",
        "heading": "11. Amakuru y'Aho Uherereye n'Ikarita",
        "body": "Gushaka abavoka bakwegereye: Kugira ngo ubashe kubona abavoka bafite ibiro hafi y'aho uherereye cyangwa hafi y'urukiko rw'akarere kawe, MyJudicial ifite ikarita ikwereka aho bari. Porogaramu ukoresha igusaba uruhushya gusa igihe ukanze ahanditse gushaka abari hafi yawe.\n\nAho urubuga rufata igihe utatanze uruhushya: Iyo wanze gutanga uruhushya cyangwa telefoni yawe itabifite, ikarita ifata i Kigali rwagati (Akarere ka Nyarugenge: -1.9441, 30.0619).\n\nNta gukurikiranwa bihoraho: Amakuru y'aho uherereye akoreshwa mu gihe ushakisha gusa hakoreshejwe uburyo bwa PostGIS ST_DWithin bubara intera iri hagati yawe n'ibiro by'umwavoka. Ntabwo duhora tugukurikirana aho ugiye kandi ayo makuru ntabikwa muri konti yawe."
      },
      {
        "id": "sec-12",
        "type": "prose",
        "heading": "12. Porogaramu Ntoya Zifashishwa ku Urubuga (Cookies)",
        "body": "Cookies z'ingenzi n'iz'urubuga: Dukoresha cookies z'ingenzi zifasha kwinjira mu buryo bwizewe no kurinda umutekano wa konti yawe (NextAuth, CSRF tokens, na Supabase auth), no gufata mu mutwe ururimi wahisemo (Icyongereza, Igifaransa, cyangwa Ikinyarwanda) hamwe n'uburyo urubuga rugaragaramo (umucyo cyangwa umwijima).\n\nNta cookies zo kwamamaza z'abandi zikoreshwa: Ntabwo dukoresha cookies z'izindi kompanyi zo gukurikirana ibyo ukora ku zindi mbuga cyangwa kwamamaza.\n\nPolitiki yihariye y'Amakuru ya Cookies: Kugira ngo umenye urutonde rwuzuye rwa cookies zikoreshwa, igihe zimaraho, n'uko wazihagarika, wasura Politiki yacu yerekeye Cookies kuri /cookies."
      },
      {
        "id": "sec-13",
        "type": "prose",
        "heading": "13. Igihe Amakuru Abikwa n'Uburyo Agenzurwa",
        "body": "Igihe cyo kubika amakuru mu mucyo: Tubika amakuru yawe gusa mu gihe gikenewe kugira ngo dusohoze ibyo yafashwe gukora no kubahiriza amategeko y'u Rwanda:\n\n• Konti zigikora: Amakuru yawe y'umwirondoro aguma kuri konti yawe mu gihe cyose igikora kugeza igihe usabye ko ifungwa cyangwa uyisibye ubwawe.\n• Inyandiko z'imari n'ibaruramari: Inyemezabwishyu z'ubujyanama, inyandiko z'amafaranga yanyuze muri escrow, n'ibindi byerekeye amafaranga bibikwa imyaka cumi (10) hakurikijwe amategeko y'ubucuruzi n'imisoro mu Rwanda (RRA) no gukumira iyezandonke.\n• Inyandiko zo mu bubiko bw'ibanga (Vault): Inyandiko z'imanza washize mu bubiko bwite zigumamo kugeza igihe uzisibiye ubwawe cyangwa ugafunga konti yawe.\n• Raporo z'umutekano n'ibikorwa byakozwe: Raporo z'umutekano (AuditLog) zibikwa kugira ngo zifashishwe mu gucunga umutekano no gukumira ibitero by'ikoranabuhanga n'uburiganya.\n• Gahunda y'Igenzura: Dukurikije amabwiriza y'Ibiro bishinzwe Kurinda Amakuru (DPO Rwanda), MyJudicial irimo gushyiraho uburyo bwikora bwo gusiba amakuru y'igihe gito igihe cyateganyijwe n'amategeko kirangiye."
      },
      {
        "id": "sec-14",
        "type": "prose",
        "heading": "14. Ingamba z'Umutekano mu By'Ikoranabuhanga no mu Mikorere",
        "body": "Twashyizeho ingamba zikomeye z'umutekano w'ikoranabuhanga kugira ngo amakuru yawe bwite atazimira, atakoreshwa cyangwa ngo aboneke ku batabifitiye uburenganzira:\n\n• Gufunga amakuru mu gihe ari mu nzira (TLS 1.3): Ibyohererezwa byose hagati ya telefone cyangwa mudasobwa yawe na seriveri zacu bifunze n'ingufuri ya HTTPS/TLS 1.3.\n• Gufunga inyandiko zo mu bubiko (AES-256-GCM): Inyandiko zose zishyirwa mu bubiko bwa OCI zifungwa n'ingufuri ikomeye ya AES-256-GCM hakoreshejwe imfunguzo zicungwa na OCI Key Management Service (KMS).\n• Kurinda ijambobanga: Amagambobanga afungwa n'imibare y'ikoranabuhanga ya Argon2/bcrypt; nta mukozi n'umwe ushobora kubona ijambobanga ryawe.\n• Kugenzura uburenganzira bw'abinjira (RBAC): Urubuga rwashyizweho mu buryo butandukanya Umuturage, Impuguke, n'Umuyobozi, ku buryo nta wureba amakuru atamureba.\n• Kubika raporo z'ibyabaye byose (AuditLog): Ibikorwa byose by'ingenzi (kwinjira, kwemeza ibyangombwa by'umwavoka, kureba inyandiko, gutanga amafaranga) byandikwa muri raporo z'umutekano zigaragaza igihe byakorewe n'aho byakorewe."
      },
      {
        "id": "sec-15",
        "type": "prose",
        "heading": "15. Kohereza Amakuru Hanze y'u Rwanda (Ingingo ya 40-42)",
        "body": "Aho seriveri ziri: Kugira ngo urubuga rurusheho kugira umutekano wizewe, ubushobozi bwo kudahagarara, n'ikoranabuhanga rigezweho, MyJudicial ikoresha amasosiyete akomeye ku rwego rw'isi afite seriveri ziherereye hanze y'u Rwanda:\n\n• Ububiko bw'amakuru n'imyirondoro: Supabase / Amazon Web Services (AWS) ziri mu Muryango w'Ubumwe bw'Uburayi (EU) no muri Leta Zunze Ubumwe za Amerika (USA);\n• Ububiko bw'inyandiko zifunze (Vault): Oracle Cloud Infrastructure (OCI) iri muri USA no muri EU;\n• Amashusho yo kugisha inama: LiveKit Cloud ifite seriveri ku isi yose;\n• Kohereza imeri na SMS: Brevo ifite seriveri mu Muryango w'Ubumwe bw'Uburayi (EU);\n• Ububiko bwihuse: Upstash Redis iri muri EU no muri USA.\n\nKubahiriza Itegeko ry'u Rwanda: Dukurikije Ingingo ya 40, 41, n'iya 42 z'Itegeko nº 058/2021, kohereza amakuru hanze y'u Rwanda bikorwa hakurikijwe amasezerano akomeye yo kurinda amakuru (Data Processing Agreements), amakuru akaba afunze mu buryo bw'ikoranabuhanga (encryption), kandi bikaba ari ngombwa kugira ngo dusohoze amasezerano ya serivisi dufitanye nawe (Ingingo ya 42)."
      },
      {
        "id": "sec-16",
        "type": "prose",
        "heading": "16. Uburenganzira Bwawe ku Makuru Bwite (Itegeko nº 058/2021)",
        "body": "Nk'uko biteganywa n'Itegeko ry'u Rwanda nº 058/2021, ufite uburenganzira bukurikira ku makuru yawe bwite:\n\n• Uburenganzira bwo kumenyeshwa (Ingingo ya 15 na 16): Kumenya mu buryo busobanutse uko amakuru yawe akusanywa n'uko akoreshwa.\n• Uburenganzira bwo kugera ku makuru (Ingingo ya 16): Gusaba kumenya amakuru tugufiteho no guhabwa kopi yayo yanditse neza.\n• Uburenganzira bwo gukosora amakuru (Ingingo ya 18): Gusaba ko amakuru atari yo cyangwa aduzuye akosorwa ako kanya. Ushobora no guhindura amakuru amwe n'amwe mu mwirondoro wawe kuri konti.\n• Uburenganzira bwo gusiba amakuru (Ingingo ya 19): Gusaba ko amakuru yawe asibwa burundu mu gihe amasezerano yarangiye cyangwa waretse gukoresha serivisi, keretse igihe amategeko y'imisoro n'ubucuruzi ategeka ko agomba kubikwa.\n• Uburenganzira bwo guhagarika by'agateganyo ikoreshwa ry'amakuru (Ingingo ya 20): Gusaba ko amakuru yawe aba ahagaritswe gukoreshwa mu gihe hari ibikigenzurwa.\n• Uburenganzira bwo kwimukana amakuru (Ingingo ya 21): Guhabwa amakuru yawe mu buryo bworoshye bwo kuyashyira ku wundi mutanga-serivisi.\n• Uburenganzira bwo kwanga ko amakuru akoreshwa (Ingingo ya 22): Kwanga ko amakuru yawe akoreshwa mu bintu bidakenewe.\n• Uburenganzira bwo kwisubiraho ku burenganzira watanze (Ingingo ya 46): Guhagarika uburenganzira wari waratanze igihe icyo ari cyo cyose.\n\nUko wakoresha uburenganzira bwawe: Ohereza ubusabe bwawe mu nyandiko ku Mukozi ushinzwe Kurinda Amakuru (DPO) kuri imeri legal@myjudicial.com. Kugira ngo turinde umutekano wawe, dushobora kugusaba kwerekana ibikuranga. Tuzakira ubusabe bwawe kandi tuguhe igisubizo mu gihe kitarenze iminsi mirongo itatu (30) iteganywa n'Itegeko nº 058/2021."
      },
      {
        "id": "sec-17",
        "type": "prose",
        "heading": "17. Kurinda Amakuru y'Abana (Abari Munsi y'Imyaka 18)",
        "body": "Imyaka 18 yo gukoresha urubuga: Urubuga rwa MyJudicial rwateganyirijwe gusa abantu bagejeje ku myaka cumi n'umunani (18) y'amavuko bafite ubushobozi bw'amategeko bwo kugira amasezerano bakurikije amategeko y'u Rwanda.\n\nAbana bakeneye serivisi z'amategeko: Dukurikije Ingingo ya 9 y'Itegeko nº 058/2021, amakuru y'umwana ntashobora gutunganywa hatanzwe uburenganzira n'umubyeyi cyangwa umurezi we wemewe n'amategeko. Iyo hakenewe ubufasha bw'amategeko ku mwana (nk'urugero mu bibazo by'umuryango cyangwa izungura), iyo serivisi igomba gutangizwa kandi igacungwa n'umubyeyi cyangwa umwishingizi we. Iyo dusanze hari umwana wiyandikishije atabiherewe uburenganzira n'umubyeyi, konti ye ihita ifungwa n'amakuru ye agasibwa."
      },
      {
        "id": "sec-18",
        "type": "prose",
        "heading": "18. Ubutumwa bwa Serivisi n'Ubutumwa bwo Kumenyekanisha",
        "body": "Ubutumwa bwa serivisi bwa ngombwa: Tukwoherereza ubutumwa bwa SMS na imeri bukenewe mu gutanga serivisi, nk'ubutumwa bwibutsa gahunda yo guhura n'umwavoka, imibare y'umutekano (OTP), inyemezabwishyu, n'ubutumwa bw'umutekano wa konti. Ubu butumwa ni ngombwa cyane ku mutekano no ku mikorere ya konti yawe, ku buryo utabuhagarika mu gihe ugikoresha urubuga.\n\nUbutumwa bwo kumenyekanisha ibikorwa bishya: Iyo dushaka kukwoherereza inyandiko zigisha amategeko cyangwa amakuru y'ibikorwa bishya, tubanza kugusaba uburenganzira. Buri butumwa bufite ahanditse gukuramo izina ryawe (unsubscribe) kugira ngo uhagarike kububona igihe cyose ubyifuje."
      },
      {
        "id": "sec-19",
        "type": "prose",
        "heading": "19. Izindi Mbuga n'Amasosiyete Dukorana",
        "body": "Imbuga z'abandi ziriho links: Urubuga rwa MyJudicial rushobora gushyiraho links zikwerekeza ku zindi mbuga z'abafatanyabikorwa, nk'Urugaga rw'Abavoka mu Rwanda (rwanda-bar.org), imbuga z'inkiko z'u Rwanda, cyangwa imbuga z'ibigo by'ubwishyu.\n\nKwigenga kw'izo mbuga: MyJudicial nta bubasha ifite ku mikorere y'izo mbuga z'abandi cyangwa uburyo zicungamo amakuru yazo. Iyo ukanze kuri izo links uba ugiye ku yindi mbuga, bityo turakugira inama yo gusoma amabwiriza yazo y'ibanga."
      },
      {
        "id": "sec-20",
        "type": "prose",
        "heading": "20. Gukemura Ibibazo by'Umutekano no Kumenyesha Abagize Ikibazo",
        "body": "Guhangana n'ibitero by'umutekano: MyJudicial ifite amabwiriza asobanutse agenga uburyo bwo gutahura no gukemura vuba ikibazo icyo ari cyo cyose cy'umutekano w'amakuru.\n\nKumenyesha inzego z'ubutabera mu masaha 48: Hakurikijwe Ingingo ya 43 y'Itegeko nº 058/2021, igihe habayeho ikibazo cy'itakara cyangwa ivumburwa ry'amakuru bwite, MyJudicial izabimenyesha Ikigo cy'Igihugu gishinzwe Umutekano w'Ikoranabuhanga / Ibiro bishinzwe Kurinda Amakuru (NCSA DPO) mu masaha adarenga mirongo ine n'umunani (48) bimenyekanye.\n\nKumenyesha abaturage bagize ikibazo: Hakurikijwe Ingingo ya 44 y'iryo tegeko, niba icyo kibazo gishobora guteza inkurikizi mbi ku burenganzira bwawe, tuzahita tukubimenyesha vuba bishoboka tukanakwereka ingamba zafashwe zo kugikemura n'icyo wakora ngo wikingire."
      },
      {
        "id": "sec-21",
        "type": "prose",
        "heading": "21. Kugeza Ikirego mu Nzego Zibifitiye Ububasha (NCSA / DPO Rwanda)",
        "body": "Kubanza kutumenyesha: Icyo ari cyo cyose utishimiye ku micungire y'amakuru yawe, turakugira inama yo kubanza kutwandikira kuri imeri y'Ushinzwe Kurinda Amakuru (DPO) kuri legal@myjudicial.com.\n\nUburenganzira bwo gutanga ikirego mu buyobozi: Ufite uburenganzira buteganywa n'Itegeko nº 058/2021 bwo kugeza ikirego mu Kigo cy'Igihugu gishinzwe gukurikirana iby'ikoranabuhanga no kurinda amakuru bwite mu Rwanda:\n\nNational Cyber Security Authority (NCSA)\nData Protection Office (DPO)\nUrubuga rwa interineti: https://dpo.gov.rw\nImeri: dpo@ncsa.gov.rw\nAho giherereye: Kigali, Repubulika y'u Rwanda"
      },
      {
        "id": "sec-22",
        "type": "prose",
        "heading": "22. Ivugururwa ry'Iyi Politiki n'Ibyahindutse",
        "body": "Ivugururwa rihoraho: Dushobora kuvugurura iyi Politiki y'Ibanga igihe hari ibyahindutse mu ikoranabuhanga, mu mikorere y'urubuga, cyangwa mu mabwiriza atangwa n'Ibiro bishinzwe Kurinda Amakuru.\n\nItariki yo kuvugurura: Itariki igaragara hejuru ku rupapuro yerekana igihe aya mabwiriza aherukira kuvugururwa no gutangira gukurikizwa.\n\nKumenyesha impinduka zikomeye: Iyo habayeho impinduka zikomeye zireba uburenganzira bwawe, tuzakubimenyesha binyuze mu butumwa bwo ku rubuga cyangwa kuri imeri yawe mbere y'uko izo mpinduka zitangira gukurikizwa. Inyandiko z'ubushize zibikwa mu buryo bw'ikoranabuhanga kandi ushobora kuzisaba ukazihabwa."
      },
      {
        "id": "sec-23",
        "type": "prose",
        "heading": "23. Tuvugishe n'Umukozi Ushinzwe Kurinda Amakuru (DPO)",
        "body": "Ku bibazo byose byerekeye iyi Politiki y'Ibanga cyangwa gukoresha uburenganzira bwawe buteganywa n'Itegeko nº 058/2021, watwandikira ukoresheje imyirondoro ikurikira:\n\n• Ushinzwe kugenzura amakuru: MyJudicial Ltd\n• Imeri y'Ushinzwe Kurinda Amakuru (DPO): legal@myjudicial.com\n• Imeri y'Ubufasha bwa tekiniki: support@myjudicial.com\n• Telefoni ngendanwa: +250 788 312 456\n• Ibiro biherereye: Centenary House, Etaji ya 4, KN 3 Ave & KN 4 St, Nyarugenge, Kigali, Rwanda\n• Agasanduku k'iposita: P.O. Box 2848, Kigali, Rwanda\n• Amasaha yo gukora: Kuwa Mbere – Kuwa Gatanu: 8:00 AM – 6:00 PM CAT"
      }
    ],
    "status": "published",
    "locale": "rw",
    "effectiveDate": "Nzeri 2026",
    "metaTitle": "Politiki y'Ibanga | MyJudicial",
    "metaDescription": "Menya uko MyJudicial irinda amakuru yawe bwite hakurikijwe Itegeko ry'u Rwanda nº 058/2021 ryerekeye kurinda amakuru bwite."
  },
  {
  "slug": "COOKIES",
  "title": "Amabwiriza Agenga Kuki (Cookie Policy)",
  "blocks": [
    {
      "id": "sec-1",
      "type": "prose",
      "heading": "1. Intangiriro n'Ibyo Aya Mabwiriza Agenga",
      "body": "MyJudicial Ltd (« MyJudicial », « twe », cyangwa « twebwe ») iyoboye ihuriro ry'ikoranabuhanga mu by'amategeko mu Rwanda, rihuza abaturage, abashoramari n'ibigo bitandukanye n'abunganizi mu mategeko bemewe kandi bagenzuwe.\n\nAya mabwiriza yerekeye Kuki (Cookie Policy) asobanura uburyo n'impamvu dukoresha kuki za HTTP, ububiko bwa porogaramu y'imbuga (localStorage), ububiko bw'igihe gito (sessionStorage) n'ubundi buryo bufitanye isano igihe usuye urubuga rwacu (myjudicial.com) cyangwa ukoresha serivisi zacu. Aya mabwiriza yashyizweho hakurikijwe Itegeko nº 058/2021 ryerekeye kurinda amakuru bwite n'ubuzima bwite bw'umuntu mu Rwanda.\n\nImbibi z'aya mabwiriza: Iyi nyandiko igenga by'umwihariko kuki n'ububiko bwa mudasobwa cyangwa terefone yawe. Ku bindi bisobanuro birambuye by'uburyo dufata, dukoresha, kandi turinda amakuru yawe muri rusange, reba Politiki y'Ibanga (Privacy Policy)."
    },
    {
      "id": "sec-2",
      "type": "prose",
      "heading": "2. Kuki n'Ubundi Bubiko bwa Browser ni Iki?",
      "body": "Imbuga za interineti zigezweho zikoresha uburyo butandukanye bwo kubika amakuru muri mudasobwa cyangwa terefone yawe kugira ngo zikore neza kandi mu mutekano:\n\n• Kuki za HTTP (HTTP Cookies): Dosiye nto zirimo inyuguti n'imibare zibikwa muri mudasobwa cyangwa terefone yawe na seriveri y'urubuga. Iyo winjiye ku zindi paji cyangwa ugarutse nyuma, browser yoherereza iyo kuki urubuga kugira ngo rukumenye kandi rugufashe kwinjira mu mutekano.\n• Ububiko bwa HTML5 (localStorage): Uburyo buhoraho bwo kubika amakuru ku gikoresho cyawe. Bukoreshwa mu kwibuka amahitamo yawe (nk'ururimi wifuza cyangwa uko urubuga rugaragara: umweru cyangwa umukara) bitiriwe byoherezwa mu butumwa bwa interineti buri kanya.\n• Ububiko bw'Igihe Gito (sessionStorage): Ububiko bumara igihe gito gusa igihe paji yawe ifunguye. Iyo ufunze paji ya browser, ayo makuru ahita asibama ako kanya."
    },
    {
      "id": "sec-3",
      "type": "prose",
      "heading": "3. Intego Yacu Nkuru: Nta Kukurikirana cyangwa Kuki z'Ubucuruzi",
      "body": "Mu buryo butandukanye n'izindi mbuga z'ubucuruzi, MyJudicial yubatswe hashingiwe ku ibanga rikomeye ry'akazi k'amategeko:\n\n• NTA Kukurikirana kw'Abandi (Zero Third-Party Tracking): Ntidukoresha Google Analytics, Meta Pixel, cyangwa utundi dukoreshoสอง two kukurikirana amateka yawe kuri interineti. Ibyo ushakisha ntabwo bikurikiranwa.\n• NTA Kuki zo Kwamamaza (No Advertising Cookies): Ntidukorana n'amasosiyete yamamaza cyangwa acuruza amakuru y'abantu ngo ashyire kuki ku bikoresho byanyu. Ntitugurisha cyangwa ngo ducuruze amakuru y'abakoresha urubuga.\n• Umutekano kuva mu Ntango (Privacy by Design): Serivisi zose z'urubuga—harimo n'ikarita yerekana aho abunganizi bakorera hamwe n'ibiganiro bya videwo—zikoresha ikoranabuhanga ryigenga ritarinda gushyiraho kuki zikurikira abantu."
    },
    {
      "id": "sec-4",
      "type": "prose",
      "heading": "4. Ibyiciro by'Ikoranabuhanga Dukoresha",
      "body": "MyJudicial ikoresha ibyiciro bitatu gusa by'ibanze kandi bikenewe cyane:\n\n• Ikoranabuhanga Rikenewe Byanze Bikunze: Rikenewe kugira ngo urubuga rukore, umukoresha abashe kwinjira mu konti ye mu mutekano, no gukumira ibitero by'ikoranabuhanga. Hatari iri koranabuhanga, kwinjira muri konti cyangwa gufata gahunda yo kugisha inama ntibyakorwa.\n• Ikoranabuhanga ry'Amahitamo n'Ururimi: Rituma urubuga rwibuka ibyo wahisemo—nk'ururimi ukunda (Icyongereza, Igifaransa, cyangwa Ikinyarwanda), uko urubuga rugaragara (Urumuri cyangwa Umwijima), n'isaha y'aho uri igihe ufata gahunda.\n• Ikoranabuhanga ry'Imikorere y'Igihe Gito: Ribika by'agateganyo aho wari ugeze—nko kwibuka niba menu ifunguye cyangwa kubika by'agateganyo amakuru y'umwirondoro w'umwunganizi igihe yiyandikisha kugira ngo adatakara mu gihe urubuga rwaba runyeganyeze."
    },
    {
      "id": "sec-5-intro",
      "type": "prose",
      "heading": "5. Imbonerahamwe ya Kuki zose za HTTP Dukoresha",
      "body": "Imbonerahamwe ikurikira irerekana kuki zose za HTTP zikoreshwa na MyJudicial n'impamvu zazo:"
    },
    {
      "id": "sec-5-table",
      "type": "table",
      "columns": [
        "Izina rya Kuki",
        "Icyiciro",
        "Uruyikora",
        "Ubwoko",
        "Igihe Imara",
        "Impamvu n'Imikorere"
      ],
      "rows": [
        [
          "authjs.session-token",
          "Ikenewe Byanze Bikunze",
          "MyJudicial Ubwayo",
          "HTTP Cookie (HttpOnly, Secure)",
          "Iminsi 30 (niba wahisemo kwibukwa) cyangwa Amasaha 8-24",
          "Igomba kubika umwirondoro w'uwazindutse muri konti; irimo JWT ibitse nomero y'umukoresha, inshingano ze n'uburenganzira bwo gukoresha serivisi."
        ],
        [
          "authjs.csrf-token",
          "Ikenewe Byanze Bikunze",
          "MyJudicial Ubwayo",
          "HTTP Cookie (HttpOnly, Secure)",
          "Igihe uri ku rubuga (Session)",
          "Umubare w'ibanga urinda ifishi yo kwinjira ibitero by'ubujura bwa interineti (CSRF)."
        ],
        [
          "authjs.callback-url",
          "Ikenewe Byanze Bikunze",
          "MyJudicial Ubwayo",
          "HTTP Cookie (HttpOnly, Secure)",
          "Igihe uri ku rubuga (Session)",
          "Yibuka paji washakaga kureba mbere yo kwinjira muri konti kugira ngo uhite uyisubizwaho umaze kwinjira."
        ],
        [
          "NEXT_LOCALE",
          "Amahitamo",
          "MyJudicial Ubwayo / next-intl",
          "HTTP Cookie",
          "Umwaka 1 (Ihoraho)",
          "Ibika ururimi wahisemo (Icyongereza, Igifaransa, cyangwa Ikinyarwanda) kugira ngo urubuga ruzakomeze kurukwereka."
        ],
        [
          "sidebar_state",
          "Imikorere",
          "MyJudicial Ubwayo",
          "HTTP Cookie",
          "Iminsi 7 (max-age=604800)",
          "Yibuka niba menu y'ubugenzuzi bwa dashboard ifunze cyangwa ifunguye."
        ]
      ]
    },
    {
      "id": "sec-6-intro",
      "type": "prose",
      "heading": "6. Imbonerahamwe y'Ubundi Bubiko (LocalStorage na SessionStorage)",
      "body": "Imbonerahamwe ikurikira irerekana amakuru abikwa muri mudasobwa cyangwa terefone yawe ku buryo bwa LocalStorage na SessionStorage:"
    },
    {
      "id": "sec-6-table",
      "type": "table",
      "columns": [
        "Izina ry'Ububiko",
        "Uburyo bubikwamo",
        "Icyiciro",
        "Igihe Bimara",
        "Impamvu n'Imikorere"
      ],
      "rows": [
        [
          "theme",
          "localStorage",
          "Amahitamo",
          "Kugeza igihe usibye amakuru",
          "Ibika niba ukoresha urubuga rufite amabara y'urumuri, umwijima, cyangwa uko mudasobwa yawe iteye (next-themes)."
        ],
        [
          "mj_lang",
          "localStorage",
          "Amahitamo",
          "Kugeza igihe usibye amakuru",
          "Ibika mu buryo bwihuse kode y'ururimi wahisemo kugira ngo ikoreshwe mu kumenya ibyo ubaza n'ubusemuzi bwa AI."
        ],
        [
          "mj_timezone",
          "localStorage",
          "Imikorere / Amahitamo",
          "Kugeza igihe usibye amakuru",
          "Ibika isaha y'aho uherereye (muri rusange Africa/Kigali) kugira ngo iminsi n'amasaha yo kugisha inama byerekanwe neza."
        ],
        [
          "expert_onboarding_wizard_data",
          "localStorage",
          "Imikorere",
          "By'agateganyo (bihita bisibama umaze kohereza)",
          "Bibika by'agateganyo amakuru y'umwunganizi uri kwiyandikisha kugira ngo adatakara niba paji yakunze guhita yifunga."
        ],
        [
          "accessToken / refreshToken",
          "sessionStorage / localStorage",
          "Ikenewe Byanze Bikunze",
          "Igihe uri muri konti gusa",
          "Bibika by'agateganyo urufunguzo rw'ikoranabuhanga ryo kwaka amakuru kuri seriveri; bihita bisibwa ako kanya iyo usotse muri konti."
        ]
      ]
    },
    {
      "id": "sec-7",
      "type": "prose",
      "heading": "7. Serivisi z'Abandi n'Ikoranabuhanga Ridafite Kuki z'Ubujura",
      "body": "Tugenzura serivisi zose zifashishwa n'urubuga rwacu kugira ngo twemeze ko nta kuki zikurikira abantu zishyirwa ku bikoresho byanyu:\n\n• Amakarita ya MapLibre GL: Amakarita yerekana aho abunganizi bakorera akoresha MapLibre GL idakoresha kuki za Google Maps cyangwa izo gukurikirana za Mapbox.\n• Videwo zo Kugisha Inama za LiveKit WebRTC: Ibiganiro bya videwo bikorwa binyuze kuri LiveKit Cloud ikoresha uburyo bufunze cyane kandi bwizewe bw'ibanga (encryption). LiveKit ntishyira kuki zikurikira abantu ku bikoresho byanyu.\n• Ubwenge bw'Ikoranabuhanga (AI) mu Gusuzuma Ibibazo: Ibyo mubaza bisuzumirwa muri seriveri zacu zizewe gusa. Nta kuki zo kwamamaza cyangwa gukurikirana zikoreshwa.\n• Supabase mu Gutanga Ubutumwa Ako Kanya: Ikoreshwa gusa mu kohereza ubutumwa ako kanya nta kuki z'abandi zibitswe."
    },
    {
      "id": "sec-8",
      "type": "prose",
      "heading": "8. Ishingiro ry'Amategeko n'Uruhushya Hakurikijwe Itegeko Nº 058/2021",
      "body": "Ishingiro rishingiye ku Mategeko: Dukurikije ingingo ya 46 y'Itegeko nº 058/2021, gukoresha kuki zikenewe byanze bikunze bishingira ku Masezerano hagati yacu nawe (ingingo ya 46(1)(b)) no ku Nyungu Zifitiye Umumaro Urubuga (ingingo ya 46(1)(f)) hagamijwe kurinda umutekano w'urubuga, kwinjira neza muri konti no gukumira uburiganya.\n\nAmahitamo y'Umukoresha: Kuki z'amahitamo (nk'ururimi cyangwa uko urubuga rugaragara) zibikwa gusa kuko ari wowe ubyihitiyemo ku bushake.\n\nImpamvu Nta Butumwa Bubuza (Banner) Bwerekanwa: Kubera ko MyJudicial IDAKORESHA na gato kuki zo kwamamaza, kukurikirana amateka y'abantu cyangwa gukusanya amakuru y'abandi, amategeko y'u Rwanda n'ay'amahanga ntabwo ategeka ko dushyiraho akadirishya gakumira paji (cookie banner). Nihagira ikoranabuhanga ryo kwamamaza ryongerwamo mu gihe kizaza, tuzabanza kubaha uburenganzira bwo kubyemera cyangwa kubyanga mbere y'uko kuki zishyirwaho."
    },
    {
      "id": "sec-9",
      "type": "prose",
      "heading": "9. Uko Wacunga, Wasuzuma cyangwa Wahagarika Kuki muri Browser Yawe",
      "body": "Ufite uburenganzira bwose n'ubushobozi bwo kugenzura kuki ziri ku gikoresho cyawe. Porogaramu zose zifashishwa mu gusura interineti zifite uburyo bwo gusuzuma, guhagarika cyangwa gusiba kuki:\n\n• Google Chrome: Settings → Privacy and security → Third-party cookies → See all site data and permissions.\n• Mozilla Firefox: Settings → Privacy & Security → Cookies and Site Data → Manage Data.\n• Apple Safari: Settings → Safari → Advanced → Privacy → Block all cookies.\n• Microsoft Edge: Settings → Cookies and site permissions → Manage and delete cookies and site data.\n\nIbizaba Iyo Uhagaritse Kuki: Nuhagarika kuki zose, ntuzabasha kwinjira muri konti yawe ya MyJudicial, ntuzabasha gufata gahunda yo kugisha inama cyangwa kwishyura. Gusa gusura urubuga no gushakisha abunganizi ku mugaragaro bizakomeza gukora."
    },
    {
      "id": "sec-10",
      "type": "prose",
      "heading": "10. Impinduka kuri Aya Mabwiriza",
      "body": "Dushobora kuvugurura aya mabwiriza igihe habayeho impinduka mu ikoranabuhanga dukoresha cyangwa mu mategeko y'u Rwanda agenga ubuzima bwite. Igihe bibaye, itariki y'« Iheruka kuvugururwa » iri hejuru kuri iyi paji izahita ivugururwa.\n\nTurabashishikariza kujya musoma aya mabwiriza kenshi kugira ngo mumenye uburyo turinda amakuru yanyu mu buhanga bw'ikoranabuhanga."
    },
    {
      "id": "sec-11",
      "type": "prose",
      "heading": "11. Twandikire cyangwa Ubaze Ushinzwe Kurinda Amakuru",
      "body": "Niba ufite ikibazo cyangwa inyunganizi kuri aya mabwiriza ya kuki cyangwa ushaka gukoresha uburenganzira uhabwa n'Itegeko nº 058/2021, twandikire ku biro bishinzwe umutekano w'amakuru:\n\n• Urwego Rushinzwe Amakuru: MyJudicial Ltd\n• Email y'Ushinzwe Kurinda Amakuru (DPO): {{dpoEmail}}\n• Email y'Ubufasha muri Rusange: {{supportEmail}}\n• Terefone ya Hotline: {{hotlinePhone}}\n• Ibiro Bikuru: {{officeAddress}}\n• Agasanduku k'Iposita: {{poBox}}\n• Amasaha y'Akazi: {{workingHours}}\n\nKu bindi bisobanuro birambuye by'uburyo dufata amakuru bwite, sura Politiki y'Ibanga (Privacy Policy)."
    }
  ],
  "status": "published",
  "locale": "rw",
  "effectiveDate": "1 Ukwakira 2026",
  "metaTitle": "Amabwiriza Agenga Kuki | MyJudicial",
  "metaDescription": "Ibisobanuro birambuye bya kuki n'ububiko bwose bwa mudasobwa bukoreshwa na MyJudicial hakurikijwe Itegeko ry'u Rwanda nº 058/2021."
},
  {
    "slug": "ABOUT",
    "title": "Kwegereza ubutabera no kugisha inama buri munyarwanda",
    "blocks": [
      {
        "id": "hero-subtitle",
        "type": "prose",
        "body": "MyJudicial ni urubuga rwa mbere rw'ikoranabuhanga mu Rwanda ruhuza abaturage na ba rwiyemezamirimo n'abavoka b'umwuga bemewe n'Urugaga rw'Abavoka mu Rwanda."
      },
      {
        "id": "mission",
        "type": "prose",
        "body": "Kworohereza buri wese kubona inama z'amategeko zizewe kandi zinoze mu Rwanda binyuze mu ikoranabuhanga ryizewe kandi ryihuse.",
        "heading": "Intego yacu"
      },
      {
        "id": "vision",
        "type": "prose",
        "body": "U Rwanda aho buri muturarwanda na buri kigo babona ubutabera n'ubufasha mu by'amategeko mu mucyo no mu buryo bworoshye.",
        "heading": "Icyerekezo cyacu"
      },
      {
        "id": "story",
        "type": "prose",
        "body": "Guhuza ubutabera n'abaturage binyuze mu cyizere, ikoranabuhanga n'umucyo.\n\nIkibazo Cyari Gihari mu Rwanda\n\nMyJudicial yatangirijwe i Kigali nyuma yo kubona ko kubona umwavoka w'umwuga uhuye n'ikibazo cyawe byari bigoranye ku baturage benshi.\n\nIgisubizo Cy'Ikoranabuhanga\n\nTwubatse urubuga rworohereza abantu kubona abavoka b'umwuga, kumenya ibiciro mbere yo gufata gahunda, no kwishyura mu mutekano binyuze kuri Mobile Money.",
        "heading": "Amateka yacu"
      },
      {
        "id": "verification-intro",
        "type": "prose",
        "body": "Umuvoka wese uri kuri MyJudicial anyuzwa mu igenzura ry'inyandiko ryandikwa mbere y'uko umwirondoro we ushira ku rubuga.",
        "heading": "Uburyo bwo kugenzura abavoka mu byiciro 4"
      },
      {
        "id": "verification-1",
        "type": "prose",
        "body": "Indangamuntu yashyizweho n'ubutegetsi hamwe n'iyisemeka ikorera mu Rwego rw'Abavoka mu Rwanda (RBA) bigakusanywa no kugenzurwa n'itsinda ryacu mbere yo gushinga umwirondoro.",
        "heading": "Kugenzura indangamuntu n'iyisemeka"
      },
      {
        "id": "verification-2",
        "type": "prose",
        "body": "Amakuru yo kwiyandikisha ageranishwa n'Urutonde rw'emewe rw'abavoka bo mu Rwego rw'Abavoka mu Rwanda kugira ngo hagaragare ko uwo muvoka yegukana umwuga.",
        "heading": "Kugenzura uko biri kurutonde rw'emewe"
      },
      {
        "id": "verification-3",
        "type": "prose",
        "body": "Abavoka bemeranya ku mafaranga yihariye atangazwa, ku mabwiriza y'ubwishyu burinzwe (escrow) n'uburyoboke bw'urubuga mbere yo gutanga ubujyanama.",
        "heading": "Isuzuma ry'imyitwarire n'amafaranga"
      },
      {
        "id": "verification-4",
        "type": "prose",
        "body": "Umwirondoro ushira ku rubuga urebwa nyuma n'umuntu. Urwego rwose rw'igenzura rwandikwa mu gitabo cy'igenzura (audit log).",
        "heading": "Isuzuma rya nyuma ry'umuntu"
      },
      {
        "id": "core-values",
        "type": "coreValues",
        "heading": "Indangagaciro zacu",
        "values": [
          {
            "id": "access",
            "title": "Kwegerezwa abaturage",
            "description": "Ubufasha mu by'amategeko bugomba kubonwa na buri wese bitabangamiye ubushobozi bwe cyangwa aho aherereye.",
            "icon": "Users"
          },
          {
            "id": "transparency",
            "title": "Gukorera mu mucyo",
            "description": "Ibiciro bisobanutse, abavoka bemewe n'Urugaga rw'Abavoka, n'ibitekerezo by'abakiriya bahawe serivisi nyakuri.",
            "icon": "Scale"
          },
          {
            "id": "trust",
            "title": "Kwizera n'Umutekano",
            "description": "Amafaranga yawe arindwa neza kugeza igihe inama y'amategeko irangiye neza kandi amakuru yawe akagirwa ibanga rikomeye.",
            "icon": "ShieldCheck"
          },
          {
            "id": "compliance",
            "title": "Ibanga ry'Umukiriya n'Amategeko",
            "description": "Twubahiriza Itegeko No 058/2021 ryerekeye kurengera amakuru bwite n'ubuzima bwite, n'ibanga ry'umunyamategeko n'umukiriya we.",
            "icon": "Lock"
          }
        ]
      },
      {
        "id": "milestones",
        "type": "milestones",
        "heading": "Ingendo yacu",
        "items": [
          {
            "id": "m-1",
            "year": "2024",
            "title": "Igitekerezo",
            "description": "MyJudicial itangira n'igitekerezo cyoroshye: gushaka umuvoka mu Rwanda ntibikwiye kuba ibiyombeye, ibinirira cyangwa ibitangaza."
          },
          {
            "id": "m-2",
            "year": "2025",
            "title": "Kugenzura no kuzigama amafaranga",
            "description": "Protokole yo kugenzura abavoka n'ubwishyu burinzwe (escrow) byubakwa, kugira ngo inyandiko n'amafaranga birindwe ku murongo wa mbere."
          },
          {
            "id": "m-3",
            "year": "2026",
            "title": "Isoko rifunguye",
            "description": "Urubuga rusange rusohoka mu ndimi eshatu, hamwe n'ubujyanama bwa videwo bwizewe n'igenzura ry'imanza rifashwa n'ikoranabuhanga (AI) ku bakiliya bo mu Rwanda hose."
          }
        ]
      },
      {
        "id": "governance-intro",
        "type": "prose",
        "body": "Amategeko asobanutse abana isoko ry'abakiliya ndetse n'abavoka.",
        "heading": "Imiyoborere y'ibigo n'ubunyamabanga"
      },
      {
        "id": "governance-1",
        "type": "prose",
        "body": "Amafaranga y'ubujyanama yakodeshwa abikwa neza kandi ashyirwa ku muvoka gusa iyo ubujyanama burangiye, cyangwa akagarurwa iyo buhagaritswe.",
        "heading": "Ishyirwa ry'amafaranga ku muvoka nyuma yo kurangiza gusa"
      },
      {
        "id": "governance-2",
        "type": "prose",
        "body": "Amafaranga atangazwa ni iyihariye kandi ajya n'ubujyanama bumwe gusa. Nta marangarema ahishe; makimbirane akemurwa hakurikijwe inzira zandikishijwe.",
        "heading": "Amafaranga yihariye, ubujyanama bumwe"
      },
      {
        "id": "governance-3",
        "type": "prose",
        "body": "Ubujyanama ni ubwite, bukorerwa abiyandikishije bonyine kandi ntibwandikwe. Amakuru atunganywa hashingiwe ku Itegeko n° 058/2021 ry'u Rwanda.",
        "heading": "Ibanga ku murongo wa mbere"
      },
      {
        "id": "ecosystem-intro",
        "type": "prose",
        "body": "MyJudicial ikorana n'inzego zizewe mu Rwanda kugira ngo yimakaze ubunyamwuga n'umutekano w'ubwishyu mu bwishingizi.",
        "heading": "Byubatse ku bufatanye n'Inzego z'Amategeko n'Imari mu Rwanda"
      },
      {
        "id": "ecosystem-legal",
        "type": "prose",
        "body": "Guhuza amakuru n'Urutonde rw'Urugaga rw'Abavoka mu Rwanda. Buri mwavoka asuzumirwa icyangombwa cy'umwuga n'uko ahagaze mu rugaga.",
        "heading": "Amategeko n'Urugaga rw'Abavoka"
      },
      {
        "id": "ecosystem-financial",
        "type": "prose",
        "body": "Ihuza ritaziguye na MTN Mobile Money, Airtel Money, na banki zizewe kugira ngo amafaranga yawe arindwe 100% mu mutekano.",
        "heading": "Ubwishingizi bw'Amafaranga & Mobile Money"
      },
      {
        "id": "ecosystem-regulatory",
        "type": "prose",
        "body": "Gukorera ku mategeko y'u Rwanda no kubahiriza Itegeko No. 058/2021 rirebana no kurinda amakuru bwite y'abantu.",
        "heading": "Ibijyanye n'Amategeko & Kurinda Amakuru"
      },
      {
        "id": "ecosystem-cta",
        "type": "callout",
        "heading": "Ubufatanye bw'Inzego",
        "body": "Uri urwego rw'amategeko, umuryango utegamiye kuri leta, cyangwa ikigo cyifuza gukorana natwe?",
        "tone": "info"
      },
      {
        "id": "disclaimer",
        "type": "callout",
        "heading": "Itangazo ry'Amategeko",
        "body": "MyJudicial ni urubuga rw'ikoranabuhanga ruhuza abakiriya n'abavoka bemewe n'Urugaga rw'Abavoka mu Rwanda. MyJudicial ntabwo ari ibiro by'avoka kandi ntitutanga ubufasha bw'amategeko mu buryo bweruye.",
        "tone": "warning"
      }
    ],
    "status": "draft",
    "locale": "rw"
  },
  {
    "slug": "CAREERS",
    "title": "Tukaka serivisi z'amategeko zorohereye gukoreshwa kuri bose",
    "blocks": [
      {
        "id": "hero-subtitle",
        "type": "prose",
        "body": "MyJudicial ni isoko ryahuza abakiriya b'u Rwanda n'abacamanza bafite ubwibone bwarezwejwe mbere yo kugaragaza imwirondoro yabo. Igikoresho gisanzwe kikiri gito, na byinshi bikigira bukubwa."
      },
      {
        "id": "why-intro",
        "type": "prose",
        "body": "Kora ku ikigoresho gisubza ikibazo gisanzwe ku munsi: gufata no kwishyura umucamanza igihe wowe nta wamwitaho kandi ntabwo uri wizi igiciro bimugomba gukishyura.",
        "heading": "Impamvu yo kubakana na MyJudicial"
      },
      {
        "id": "why-access",
        "type": "prose",
        "body": "Umuntu uri hanze y'i Kigali, nta wamwitaho, ashobora gushakisha hakurikijwe urwoko rw'ibibazo n'aho ari, kureba igiciro gizigere gikwihishe cyo kuganira mbere yo kwiyemeza, no gusoma urubuga mu rurimi rwe.",
        "heading": "Butabera bugera kuri bose"
      },
      {
        "id": "why-transparency",
        "type": "prose",
        "body": "Igiciro cyo kuganira cyigaragazwa mbere yo kwinjira, aho kuganirwa buri ikibazo gihitandukanye. Amafaranga yaciwe ahurishwa na ikiganza gikomeye muri kandi y'ibiciro igenga imirimo, hanyuma akurikiranywa cyangwa agasubirwa hakurikijwe ikiganza gikaba.",
        "heading": "Ibisobanuro by'ibiciro biboneye"
      },
      {
        "id": "why-verification",
        "type": "prose",
        "body": "Buri mucamanza atanga indangamuntu n'ubwibone bw'Urugaga. Ikipe yacu y'ubwandashatiriro cyaraguruka buri dosiye imwe, mbere yo kugaragaza umwirondoro, kandi igice kimwe cy'ibyemezo kirandikwa. Umwandikire w'ubwibone ntuzazumwa mu kandi y'Ihuramareke rw'Urugaga rwa Rwanda.",
        "heading": "By'ubuzimumu byasuzumwe"
      },
      {
        "id": "why-impact",
        "type": "prose",
        "body": "Umurimo uragaragara mu kuryo umuntu umwe ashobora kubona umucamanza, kumenya igiciro, no gutuma ikibazo cy'amategeko kigenda igere, ubwe adafite umuntu uwo azwi ukanwa.",
        "heading": "Umugwira ukora ku muryango"
      },
      {
        "id": "workon-intro",
        "type": "prose",
        "body": "Imbuga ziri inyuma y'urubuga, hatabari ibisigaragariye kuzakura.",
        "heading": "Ibyo dukora"
      },
      {
        "id": "workon-marketplace",
        "type": "prose",
        "body": "Gushakisha hifano no mu muhanda, ukoresheje ibyo uyu munsi: urwoko rw'ibibazo, urwoko rw'ibiciro, inota, ubumenyerezi n'ubukene, mu byiciro by'umwaga bihari.",
        "heading": "Isoko n'Ishakiro"
      },
      {
        "id": "workon-payments",
        "type": "prose",
        "body": "Kwishyura kuri telefone ukoresha igikoresho cy'abahanga, ububiko bw'amafaranga bufunga igiciro cyaciwe ku kuganira, gusubiza amafaranga igihe umuganga wabyitse, n'ubwanditse bw'amafaranga umucamanza abazwa. Kohereza amafaranga ku munsi, kwishyura ikarita, no gucunga amakimbirane ntibirabikora.",
        "heading": "Kwishyura n'Uburyo bw'Ikiganza"
      },
      {
        "id": "workon-ai",
        "type": "prose",
        "body": "Umuntu asobanura ikibazo cy'amategeko mu maganaga ye, akabana urwoko rw'ibibazo runaka, ubukana bwacyo, igiciro gikwiye, n'abacamanza bafite igihano ku kibazo.",
        "heading": "AI Rifasha Kumenya Ikibazo"
      },
      {
        "id": "workon-video",
        "type": "prose",
        "body": "Ikiganiro gikoreshwa muri porogaramu y'urubuga (WebRTC), aho gusa ibi bire abiri b'igikino kiri gikangurwe kwinjira. Nta igihe n'umwe igiganiro gikarambwa. Ubwirinzi bwa E2EE ntabwo gufunguwe uyu munsi.",
        "heading": "Amashusho y'Amahoro y'Umunsi"
      },
      {
        "id": "workon-verification",
        "type": "prose",
        "body": "Indangamuntu n'ubwibone bw'Urugaga bifunganywa aho hagahwamye, bigataragarawaga ushobora gusa ku mugenzura ukurikirana, kandi igihe kimwe cy'ubwandashatiriro gikora gisobanurwa mu kaseke y'inyandiko.",
        "heading": "Kugenzura By'Ibyangombwa"
      },
      {
        "id": "workon-localization",
        "type": "prose",
        "body": "Igikoresho cy'abaturage gikohereza mu Kinyarwanda, Icyongereza n'Igifaransa. Ibisobanuro ku muhanda wose ntibikora neza, kandi icyo cyo gukemura ni icyo dukora buri munsi.",
        "heading": "Igikoresho gikoresha indimi shatatu"
      },
      {
        "id": "how-intro",
        "type": "prose",
        "body": "Amahwirize matandatu dukoresha kugira ngo twemezemo.",
        "heading": "Uburyo dukora"
      },
      {
        "id": "how-p1",
        "type": "prose",
        "body": "Ihindamya rikwiye gukora niba rikuraho ikigongwe, ikibazo cyangwa ubwoba ku muntu ugerageza gushaka ubufasha bw'amategeko. Niba rikaba ntiabyo, nacyo ntiribwire.",
        "heading": "Gutanga umuturage mbere"
      },
      {
        "id": "how-p2",
        "type": "prose",
        "body": "Ibibazo by'amategeko ni ibangamiye. Twitaho ibibanga, umutekano n'ubwitange mu gufata amakuru, kandi amategeko yacu y'ubwirinzi ugaragaza mu buryo buseshe twabyika n'ibizakozwa n'ubwo impamvu yabyo.",
        "heading": "Kubaka neza no kurinda ibibanga"
      },
      {
        "id": "how-p3",
        "type": "prose",
        "body": "Igihe igikoresho kitagira igisobanuro gikuru, tubibwira ukuri. Dukunda kuba dukwiye mu kuvuga ukuri icyo igikoresho gikora, kuruta ko dukora igisura mu kuvuga icyo gishobora gukora.",
        "heading": "Icyizere gikuru ku kurondora kw'ukuri"
      },
      {
        "id": "how-p4",
        "type": "prose",
        "body": "Dutunze cyane cyo gukora kuri telefone isanzwe no mu murongo w'imbaho usanzwe mu Rwanda, kuruta cyo gukora gusa muri demo.",
        "heading": "Gukemura ibibazo biza"
      },
      {
        "id": "jobs",
        "type": "jobs"
      },
      {
        "id": "faq-1",
        "type": "prose",
        "body": "MyJudicial iri i Kigali, mu Rwanda.",
        "heading": "MyJudicial iberi he?"
      },
      {
        "id": "faq-2",
        "type": "prose",
        "body": "Yego. Andikira kuri adresi y'akazi yagaragajwe kuri iyi paji. Umwe mu itsinda ayisoma. Nta na kimure kikubitswe kuri uyu mwebsite, kandi niba ushaka gukomeza, usubiramo ubutumwa wahereye.",
        "heading": "Nshobora kubikira niba nta myanya ihari?"
      },
      {
        "id": "faq-3",
        "type": "prose",
        "body": "Intangiriro ngufi, umwirondoro wawe cyangwa CV, imiyoboro y'ibikorwa wishimira, n'ibice by'urubuga wifuza gukora.",
        "heading": "Ni iki ngomba gushyira?"
      },
      {
        "id": "faq-4",
        "type": "prose",
        "body": "Igikoresho cy'abaturage gikora mu Kinyarwanda, Icyongereza n'Igifaransa. Ariko ibisobanuro ntibikora neza kuri buri upapuro.",
        "heading": "Ni izihe ndimi MyJudicial ishimira?"
      },
      {
        "id": "cta",
        "type": "callout",
        "heading": "Wifuza kubakana natwe?",
        "body": "Bwira icyo wifuza gukora, cyangwa urebe icyo MyJudicial ikora uyu munsi.\n\nOhereza ubusabe bwawe",
        "tone": "info"
      }
    ],
    "status": "draft",
    "locale": "rw"
  },
  {
    "slug": "CONTACT",
    "title": "Turahari ku Bwanyu",
    "blocks": [
      {
        "id": "hero-subtitle",
        "type": "prose",
        "body": "Ikipe yacu ishinzwe ibikorwa by'amategeko i Kigali iriteguye kugufasha ku bijyanye n'abakiriya, kugenzura abunganizi, cyangwa ubufatanye n'inzego."
      },
      {
        "id": "departments",
        "type": "prose",
        "body": "Ubufasha bw'Abaturage n'Abakiriya — Ubufasha mu gutumiza inama z'amategeko, ibyumba by'amashusho bya LiveKit, no kubitsa mu bwishingizi bwa MoMo/Airtel. (support@myjudicial.com)\n\nIgenzura ry'Abunganizi mu Mategeko — Igenzura ry'abanyamuryango b'Urugaga rw'Abavoka mu Rwanda (RBA), gufungura amakonti y'umwuga, no kwishyurwa. (support@myjudicial.com)\n\nUbufatanye bw'Inzego — Gukorana n'urugaga rw'abunganizi, imishinga y'ubutabera y'imiryango itegamiye kuri leta, n'ibigo by'ubucuruzi. (support@myjudicial.com)",
        "heading": "Aho Wadusanga"
      },
      {
        "id": "office",
        "type": "prose",
        "body": "Centenary House, Etaje ya 4, KN 3 Ave & KN 4 St\n\nUmujyi rwagati wa Nyarugenge, Kigali, u Rwanda\n\nHegereye Urukiko rw'Ubucuruzi rwa Nyarugenge\n\nAmasaha y'Akazi: Kuwa Mbere – Kuwa Gatanu: 8:00 – 18:00 (CAT)",
        "heading": "Icyicaro Gikuru i Kigali"
      },
      {
        "id": "channels",
        "type": "callout",
        "heading": "Imeli",
        "body": "support@myjudicial.com\n\n+250 788 312 456",
        "tone": "info"
      },
      {
        "id": "contact-card",
        "type": "contactCard"
      },
      {
        "id": "self-service",
        "type": "prose",
        "body": "Koresha urubuga rwacu rurimo abavoka bemewe n'ibisubizo byihuse bitagusaba gutegereza.\n\nShaka Umwunganizi Wemejwe: Shakisha mu bavoka barenga 100 b'Urugaga rw'u Rwanda bafite uburambe buzwi mu nkiko n'ibiciro bisobanutse.\n\nIbiciro Bisobanutse n'Ubwishingizi: Menya uko amafaranga wishyuye kuri MoMo cyangwa Airtel aguma mu bwishingizi bwizewe kugeza inama irangiye.\n\nIbibazo Bikunze Kubazwa (FAQs): Amabwiriza y'uburyo bwo gufata gahunda, gushyiraho ibyangombwa by'ubutaka UPI, no kwinjira mu nama y'amashusho.",
        "heading": "Ukeneye Umwunganizi Cyangwa Ibisubizo Ako Kanya?"
      }
    ],
    "status": "draft",
    "locale": "rw"
  }
];
