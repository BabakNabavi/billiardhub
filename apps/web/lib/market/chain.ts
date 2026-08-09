/* ═══════════════════════════════════════════════════════════════
   زنجیره‌ی «دسته → نوع → برند → مدل» — منبعِ واحد.
   ───────────────────────────────────────────────────────────────
   تا امروز این فهرست‌ها فقط داخلِ فرمِ ثبتِ آگهی
   (`app/shop/new/page.tsx`) زندگی می‌کردند. نتیجه‌اش این بود که
   فرمِ **ویرایش** هیچ‌کدامشان را نمی‌شناخت: نه فهرستِ درستِ دسته‌ها
   را داشت (دسته‌های ساختگیِ `educational` و `accessory` را نشان
   می‌داد و `tip`/`chalk`/`cloth` را اصلاً نه)، نه فیلدِ «نوع»
   داشت، و نه می‌دانست برندِ چوبِ اسنوکر با برندِ چوبِ پاکت فرق
   دارد. فروشنده آگهیِ «تیپ» را باز می‌کرد و فرم «میز بیلیارد»
   نشانش می‌داد — و ذخیره، دسته‌ی آگهی را واقعاً عوض می‌کرد.

   حالا هر دو فرم از همین‌جا می‌خوانند.
   ═══════════════════════════════════════════════════════════════ */

/* «نوع» برای هر دسته — دراپ‌داون بالای فرم (اجباری). دسته‌هایی که اینجا نیستند، «نوع» متن آزاد می‌گیرند.
   توجه: در «چوب» گزینه‌ی «سایر» حذف شده است. */
export const TYPE_OPTIONS: Record<string, string[]> = {
  cue:        ['پاکت بیلیارد', 'اسنوکر', 'هی‌بال', 'کارامبول'],
  table:      ['پاکت بیلیارد', 'اسنوکر', 'هی‌بال', 'کارامبول', 'خانگی'],
  /* «کیوبال» توپِ ضربه است و جدا فروخته می‌شود؛ «سایر» برای هر
     چیزی که در این سه نمی‌گنجد، با فیلدِ توضیح. */
  /* ── چرا اول رشته و بعد تعداد ──
     گزینه‌های قبلی با عدد شروع می‌شدند («۱۵ تایی پاکت بیلیارد») و
     خریدار اول باید عدد را می‌خواند تا بفهمد اصلاً توپِ کدام رشته
     است. حالا نام رشته جلو است و «توپ تکی» هم اضافه شد — فروشِ تکیِ
     توپ رایج است و تا امروز جایی در فهرست نداشت. */
  ball:       ['اسنوکر', 'پاکت بیلیارد', 'کارامبول', 'کیوبال', 'تکی', 'سایر'],
  tip:        ['اسنوکر', 'پاکت بیلیارد', 'هی‌بال'],
  'case-bag': ['کیس سخت', 'کیس نرم', 'کیف', 'کوله‌پشتی'],
  /* گچ: نوع فقط برای دسته‌بندی؛ لیست برند مستقل از نوع است (هرکدام که انتخاب شود همان برندهای گچ می‌آید) */
  chalk:      ['اسنوکر', 'پاکت بیلیارد', 'هی‌بال'],
}

/* برندهای «چوب» بر اساس نوع (اسنوکر / پاکت بیلیارد). «سایر» ⇒ فیلد متن دستی باز می‌شود.
   نوع‌های دیگر (هی‌بال/کارامبول) برند متن آزاد می‌گیرند. */
const CUE_BRANDS: Record<string, string[]> = {
  'اسنوکر': ['John Parris', 'Peradon', 'Cue Craft', "O'Min", 'Ton Praram', 'Phoenix', 'PowerGlide', 'Trevor White', 'Jason Owen', 'Mike Wooldridge', 'Woods Cues', 'BCE', 'Precision', 'Master Cue', 'Maximus', 'Paochan', 'سایر'],
  'پاکت بیلیارد': ['Predator', 'Mezz', 'McDermott', 'Meucci', 'Jacoby', 'Pechauer', 'Viking', 'Cuetec', 'Joss', 'Lucasi', 'Longoni', 'Becue', 'Tiger', 'Schon', 'Players', 'Action', 'Poison', 'OB', 'Falcon', 'Dufferin', 'سایر'],
}

/* مدل‌های «چوب» بر اساس برند. برندهایی که اینجا نیستند ⇒ مدل متن دستی. «سایر» ⇒ فیلد متن. */
const CUE_MODELS: Record<string, string[]> = {
  'Peradon':        ['Winchester', 'Newbury', 'Guildford', 'Harlow', 'Knight', 'Joe Davis 600', 'Chiltern', 'Royal', 'Edwardian', 'Salisbury', 'Cannon', 'Crown', 'Lazer', 'Warwick', 'Oxford', 'Trafalgar', 'Stamford', 'Liverpool', 'York', 'Sheffield', 'سایر'],
  'McDermott':      ['SN801', 'SN802', 'SN401', 'SN402', 'SN404', 'SN503', 'SN504', 'سایر'],
  'Predator':       ['Classic', 'Crown', 'Royal', 'Edwardian', 'Winchester', 'Newbury', 'Guildford', 'Harlow', 'Knight', 'York', 'King', 'Pro Cue', 'Joe Davis', 'Walter Lindrum', 'Lazer', 'Salisbury', 'Trafalgar', 'Oxford', 'Liverpool', 'Sheffield', 'Warwick', 'Cannon', 'سایر'],
  'John Parris':    ['Traditional', 'Professional', 'Ultimate', 'Ultimate Pro', 'Paragon', 'Ambassador', 'Exclusive', 'Custom Built', 'Signature', 'Titanium Ferrule Series', 'سایر'],
  "O'Min":          ['Classic', 'Traditional', 'Champion', 'Professional', 'Master', 'Black Series', 'Signature', 'Prestige', 'Supreme', 'Ultimate', 'Handmade Series', 'Custom Series', 'Limited Edition', 'سایر'],
  'Cue Craft':      ['Traditional', 'Heritage', '3 Lions', 'Signature', 'Champion', 'Professional', 'Custom Handmade', 'Limited Edition', 'سایر'],
  'PowerGlide':     ['Heritage', 'Classic', 'Deluxe', 'Supreme', 'Diamond', 'Challenger', 'Club', 'Competition', 'Professional', 'Custom', 'سایر'],
  'Ton Praram':     ['Classic', 'Champion', 'Professional', 'Ultimate', 'Signature', 'Handmade', 'Custom', 'سایر'],
  'Phoenix':        ['Master', 'Supreme', 'Professional', 'Classic', 'Maple Series', 'Ash Series', 'Handmade', 'سایر'],
  'Maximus':        ['Ultimate', 'Impression', 'Master', 'Professional', 'Handmade', 'Custom', 'سایر'],
  'Trevor White':   ['Traditional', 'Professional', 'Handmade', 'Signature', 'Custom', 'سایر'],
  'Mike Wooldridge':['Professional', 'Signature', 'Handmade', 'Traditional', 'Custom', 'سایر'],
}

/* برندهای دسته‌های دیگر (توپ/کیس/پارچه/گچ/تیپ/اکستنشن/اکسسوری/رست) — مستقل از نوع.
   «سایر» به‌صورت خودکار ته لیست اضافه می‌شود (withOther). */
const CAT_BRANDS: Record<string, string[]> = {
  ball:       ['Aramith', 'Dynaspheres', 'Predator', 'Cyclop', 'Super Aramith', 'Riley', 'Brunswick', 'Molinari', 'Diamond'],
  'case-bag': ['Predator', 'Mezz', 'Cuetec', 'Poison', 'Instroke', 'Justis', 'Whitten', 'JB Cases', 'Kronos', 'Longoni', 'Omin'],
  cloth:      ['Simonis', 'Strachan', 'Hainsworth', 'Milliken', 'Championship', 'Gorina', 'Iwan Simonis'],
  extension:  ['Predator', 'Mezz', 'Cuetec', 'Longoni', 'Peradon', 'John Parris', 'Riley', 'Omin', 'Universal'],
  accessory:  ['Predator', 'Kamui', 'Mezz', 'Cuetec', 'Longoni', 'Aramith', 'Magic Ball Rack', 'Accu Rack', 'Q-Wiz', 'Tweeten', 'Master', 'Tiger', 'Universal'],
  rest:       ['Peradon', 'Riley', 'Hamilton', 'PowerGlide', 'Master', 'Tweeten', 'Longoni', 'Predator'],
}

/* مدل‌های هر دسته بر اساس برند. برندهایی که اینجا نیستند ⇒ مدل متن دستی. «سایر» خودکار اضافه می‌شود. */
const CAT_MODELS: Record<string, Record<string, string[]>> = {
  ball: {
    'Aramith':       ['Tournament Champion', 'Tournament Black', 'Premium', 'Super Pro', 'Premier', 'Pro Cup', 'Pro Cup TV', 'Duramith', 'Stone Collection', 'Philosophy Collection'],
    'Dynaspheres':   ['Platinum', 'Titanium', 'Earth', 'Carom'],
    'Predator':      ['Arcos II', 'Arcos'],
    'Cyclop':        ['Hyperion', 'TV Pro', 'Super Pro', 'Prime'],
    'Super Aramith': ['Pro', 'Premium', 'Tournament'],
    'Riley':         ['Standard', 'Tournament'],
    'Brunswick':     ['Centennial', 'Pro Cup'],
    'Molinari':      ['Tournament Set'],
    'Diamond':       ['Tournament Balls'],
  },
  'case-bag': {
    'Predator': ['Metro Case', 'Roadline Case', 'Urban Case', 'Hard Case'],
    'Mezz':     ['MZ Series', 'MP Series', 'Hybrid Case'],
    'Cuetec':   ['Pro Case', 'Cynergy Case'],
    'Poison':   ['Voodoo Case', 'Smash Case'],
    'Instroke': ['Cowboy', 'Deluxe', 'Buffalo', 'Leather Case'],
    'Justis':   ['Custom Leather', 'Traditional'],
    'Whitten':  ['Custom Case', 'Leather Series'],
    'JB Cases': ['Hybrid', 'Custom', 'GTF', 'Butterfly'],
    'Kronos':   ['Hard Case', 'Soft Case'],
    'Longoni':  ['Luxury Case', 'Leather Case'],
    'Omin':     ['Classic Case', 'Premium Case'],
  },
  cloth: {
    'Simonis':      ['860', '860 HR', '760', '920', '300 Rapide', '300 Tournament'],
    'Strachan':     ['6811', '6811 Tournament', '777', '10K'],
    'Hainsworth':   ['Match', 'Smart', 'Precision', 'Elite Pro'],
    'Milliken':     ['Tournament Cloth', 'Super Pro'],
    'Championship': ['Tour Edition', 'Invitational', 'Mercury Ultra'],
    'Gorina':       ['Super Pro', 'Basalt', 'Granito'],
    'Iwan Simonis': ['860 Tournament', '760 Tournament'],
  },
  extension: {
    'Predator':    ['QR Extension', 'Uni-Loc Extension', 'Air II Extension'],
    'Mezz':        ['Mezz Extension', 'Exceed Extension', 'Wavy Extension'],
    'Cuetec':      ['Cynergy Extension', 'AVID Extension'],
    'Longoni':     ['Longoni Extension', 'Quick Release Extension'],
    'Peradon':     ['Telescopic Extension', 'Mini Extension'],
    'John Parris': ['Snooker Extension', 'Classic Extension'],
    'Riley':       ['Riley Extension', 'Telescopic Extension'],
    'Omin':        ['Classic Extension', 'Premium Extension'],
    'Universal':   ['Universal Screw Extension', 'Universal Quick Release Extension'],
  },
  accessory: {
    'Predator':        ['Second Skin Glove', 'Chalk Holder', 'Joint Protector', 'Tip Tool', 'Ball Rack'],
    'Kamui':           ['Kamui Glove', 'Tip Tool', 'Gator Grip', 'Tip Shaper', 'Joint Protector'],
    'Mezz':            ['Mezz Glove', 'Tip Tool', 'Joint Protector', 'Extension Holder'],
    'Cuetec':          ['Cynergy Glove', 'Tip Tool', 'Cue Towel', 'Joint Protector'],
    'Longoni':         ['Professional Glove', 'Tip Tool', 'Cue Towel', 'Joint Protector'],
    'Aramith':         ['Ball Rack', 'Triangle Rack', 'Ball Cleaner', 'Ball Polisher'],
    'Magic Ball Rack': ['9 Ball Rack', '10 Ball Rack', '8 Ball Rack'],
    'Accu Rack':       ['9 Ball', '10 Ball', '8 Ball', 'Template Rack'],
    'Q-Wiz':           ['Shaft Cleaner', 'Burnisher', 'Microfiber Cloth'],
    'Tweeten':         ['Tip Pick', 'Tip Tool', 'Cue Wax'],
    'Master':          ['Tip Scuffer', 'Tip Pick', 'Chalk Holder'],
    'Tiger':           ['Tip Tool', 'Tip Shaper', 'Burnisher'],
    'Universal':       ['Cue Towel', 'Glove', 'Chalk Holder', 'Extension Holder', 'Cue Stand'],
  },
  rest: {
    'Peradon':    ['Spider Rest', 'Swan Rest', 'Cross Rest', 'Hook Rest', 'Half Butt', 'Full Butt', 'Telescopic Rest'],
    'Riley':      ['Spider', 'Cross', 'Rest Head', 'Telescopic Rest'],
    'Hamilton':   ['Tournament Rest', 'Club Rest'],
    'PowerGlide': ['Spider Rest', 'Cross Rest', 'Rest Set'],
    'Master':     ['Spider', 'Cross', 'Rest Head'],
    'Tweeten':    ['Bridge Head', 'Rest Accessories'],
    'Longoni':    ['Carom Bridge', 'Pool Bridge'],
    'Predator':   ['Extension Bridge', 'Pool Bridge'],
  },
}

/* برندهای «میز» بر اساس نوع (اسنوکر/پاکت/هی‌بال) — مثل چوب، وابسته به نوع.
   نوع‌های دیگر (کارامبول/خانگی) برند متن آزاد می‌گیرند. */
const TABLE_BRANDS: Record<string, string[]> = {
  'اسنوکر':       ['Wiraka', 'JOY', 'Rasson', 'Xingpai (Star)', 'Riley', 'BCE', 'Hamilton', 'Thurston', 'Shender', 'DPT'],
  'پاکت بیلیارد': ['Diamond', 'Brunswick', 'Olhausen', 'Rasson', 'Riley', 'Dynamic', 'Buffalo', 'Valley', 'Connelly', 'Imperial', 'Toulet', 'SAM'],
  'هی‌بال':        ['JOY', 'Wiraka', 'Xingpai (Star)', 'Rasson', 'Shender', 'Xingjue', 'Super Power', 'Hans Delta'],
}

/* مدل‌های «میز» بر اساس نوع سپس برند (یک برند در نوع‌های مختلف مدل‌های متفاوت دارد). */
const TABLE_MODELS: Record<string, Record<string, string[]>> = {
  'اسنوکر': {
    'Wiraka':         ['M1 Tournament Steelblock', 'M1 Classic', 'M1 Classic Gold', 'M1 1980', 'Jewel', 'Armour Rocky', 'Berlin Commercial', 'Morris'],
    'JOY':            ['Q7 Snooker'],
    'Rasson':         ['Magnum Pro', 'Sword II', 'Strong II', 'Victory II Snooker', 'Ambassador', 'OX Snooker'],
    'Xingpai (Star)': ['S101', 'S102', 'S103', 'S104', 'S105', 'S106', 'S107', 'XW101-12S', 'XW102', 'XW103', 'Champion Series', 'Tournament Series'],
    'Riley':          ['Aristocrat', 'Renaissance', 'Clubmaster', 'Tournament', 'Match', 'Burwat'],
    'BCE':            ['Westbury', 'Supreme', 'Club', 'Tournament'],
    'Hamilton':       ['Tournament', 'Club', 'Heritage'],
    'Thurston':       ['Tournament Table', 'Club Table', 'Heritage'],
    'Shender':        ['S100', 'S200', 'S300', 'S500', 'Champion'],
    'DPT':            ['Professional Snooker', 'Tournament Snooker'],
  },
  'پاکت بیلیارد': {
    'Diamond':   ['Professional', 'Professional Tournament', 'Pro-Am', 'Paragon', 'League', 'Smart Table'],
    'Brunswick': ['Gold Crown I', 'Gold Crown II', 'Gold Crown III', 'Gold Crown IV', 'Gold Crown V', 'Gold Crown VI', 'Gold Crown VII', 'Anniversary', 'Centennial', 'Black Wolf', 'Black Wolf Pro', 'Allenton', 'Botanic', 'Bristol', 'Canton', 'Glenwood', 'Oakland', 'Sanibel', 'Winfield', 'Bayfield', 'Contender', 'Metro'],
    'Olhausen':  ['Americana', 'Augusta', 'Belmont', 'Eclipse', 'Grand Champion', 'Hampton', 'Monaco', 'Orleans', 'Pasadena', 'Reno', 'Tahoe', 'West End'],
    'Rasson':    ['Victory II', 'Victory II Plus', 'Acurra', 'Challenger', 'Challenger Plus', 'OX', 'Leo', 'Shadow', 'Black Hole', 'Caesar'],
    'Riley':     ['Elegance', 'Windsor', 'Hamilton', 'Classic'],
    'Dynamic':   ['Dynamic II', 'Dynamic III', 'Triumph'],
    'Buffalo':   ['Eliminator', 'Dominator', 'Gladiator', 'Harwood', 'Royal'],
    'Valley':    ['Panther', 'Cougar', 'Tiger', 'Black Cat'],
    'Connelly':  ['Catalina', 'Cochise', 'Presidio', 'Ventura'],
    'Imperial':  ['Eliminator', 'Penelope', 'Reno', 'Bishop'],
    'Toulet':    ['BlackLight', 'Crystal', 'Dining Collection'],
    'SAM':       ['Atlantic', 'K Steel', 'Competition'],
  },
  'هی‌بال': {
    'JOY':            ['Q3+', 'Q7', 'Q8', 'Q8 Pro', 'Q9', 'G3'],
    'Wiraka':         ['Classic M1 Chinese Pool', 'CM1'],
    'Xingpai (Star)': ['Champion Series', 'Tournament Series'],
    'Rasson':         ['Victory II Heyball', 'Victory II Plus Heyball', 'Acurra Heyball'],
    'Shender':        ['Heyball Professional', 'Tournament Heyball'],
    'Xingjue':        ['Professional Series', 'Tournament Series'],
    'Super Power':    ['Competition Series', 'Professional Series'],
    'Hans Delta':     ['Tournament Series', 'Club Series'],
  },
}

/* برندهای «تیپ» بر اساس نوع (اسنوکر/پاکت/هی‌بال) — مثل چوب/میز، وابسته به نوع. */
const TIP_BRANDS: Record<string, string[]> = {
  'اسنوکر':       ['Kamui', 'Century', 'Elk Master', 'Blue Diamond', 'ADR147', 'Talisman', 'Moori', 'Zan', 'G2', 'Navigator', 'HOW', 'Tiger', 'Taom', 'Le Professional', 'Triangle', 'Peradon', 'Riley', 'PowerGlide'],
  'پاکت بیلیارد': ['Kamui', 'Predator', 'Tiger', 'HOW', 'Zan', 'Moori', 'Navigator', 'G2', 'Taom', 'Le Professional', 'Triangle', 'Blue Diamond', 'Molinari', 'Longoni', 'Caiden', 'KO Brothers', 'Techno Dud'],
  'هی‌بال':        ['Kamui', 'Predator', 'HOW', 'Tiger', 'Zan', 'Navigator', 'G2', 'Taom', 'Molinari', 'Caiden', 'KO Brothers'],
}

/* مدل‌های «تیپ» بر اساس نوع سپس برند. */
const TIP_MODELS: Record<string, Record<string, string[]>> = {
  'اسنوکر': {
    'Kamui':          ['Black', 'Original', 'Clear Black', 'Clear Original', 'Athlete'],
    'Century':        ['G1'],
    'Elk Master':     ['Elk Master'],
    'Blue Diamond':   ['Blue Diamond'],
    'ADR147':         ['Ultimate'],
    'Talisman':       ['Pro', 'WB'],
    'Moori':          ['Moori', 'Quick'],
    'Zan':            ['Plus', 'Hybrid Max', 'Boost'],
    'G2':             ['G2'],
    'Navigator':      ['Alpha', 'Black'],
    'HOW':            ['HOW'],
    'Tiger':          ['Sniper', 'Everest', 'Onyx'],
    'Taom':           ['Fusion'],
    'Le Professional':['Le Professional'],
    'Triangle':       ['Triangle'],
    'Peradon':        ['Peradon'],
    'Riley':          ['Riley'],
    'PowerGlide':     ['PowerGlide'],
  },
  'پاکت بیلیارد': {
    'Kamui':          ['Black', 'Original', 'Clear Black', 'Clear Original', 'Athlete'],
    'Predator':       ['Victory'],
    'Tiger':          ['Sniper', 'Everest', 'Onyx', 'Dynamite', 'Emerald', 'Icebreaker'],
    'HOW':            ['HOW', 'Titan'],
    'Zan':            ['Plus', 'Hybrid Max', 'Boost'],
    'Moori':          ['Moori', 'Quick'],
    'Navigator':      ['Alpha', 'Black', 'Blue Impact'],
    'G2':             ['G2'],
    'Taom':           ['Fusion'],
    'Le Professional':['Le Professional'],
    'Triangle':       ['Triangle'],
    'Blue Diamond':   ['Blue Diamond'],
    'Molinari':       ['Molinari'],
    'Longoni':        ['Longoni'],
    'Caiden':         ['Warrior', 'Fenrir'],
    'KO Brothers':    ['KO Brothers'],
    'Techno Dud':     ['Techno Dud'],
  },
  'هی‌بال': {
    'Kamui':       ['Black', 'Original', 'Athlete'],
    'Predator':    ['Victory'],
    'HOW':         ['HOW', 'Titan'],
    'Tiger':       ['Sniper', 'Everest', 'Onyx'],
    'Zan':         ['Plus', 'Hybrid Max'],
    'Navigator':   ['Alpha', 'Black'],
    'G2':          ['G2'],
    'Taom':        ['Fusion'],
    'Molinari':    ['Molinari'],
    'Caiden':      ['Warrior', 'Fenrir'],
    'KO Brothers': ['KO Brothers'],
  },
}

/* گچ — برند/مدل بر اساس نوع. اسنوکر و هی‌بال یک داده‌ی مشترک؛ پاکت داده‌ی جدا. */
const SNOOKER_CHALK_BRANDS = ['Taom', 'Kamui', 'Master', 'Triangle', 'Blue Diamond', 'Silver Cup', 'Peradon', 'Riley', 'PowerGlide', 'Century', 'Pioneer']
const SNOOKER_CHALK_MODELS: Record<string, string[]> = {
  'Taom':         ['V10', 'Snooker Chalk 2.0', 'Soft', 'Pyro'],
  'Kamui':        ['Roku'],
  'Master':       ['Master Chalk'],
  'Triangle':     ['Triangle Chalk'],
  'Blue Diamond': ['Blue Diamond'],
  'Silver Cup':   ['Silver Cup'],
  'Peradon':      ['Peradon Chalk'],
  'Riley':        ['Riley Chalk'],
  'PowerGlide':   ['PowerGlide Chalk'],
  'Century':      ['Century Chalk'],
  'Pioneer':      ['Pioneer Chalk'],
}
const CHALK_BRANDS: Record<string, string[]> = {
  'اسنوکر':       SNOOKER_CHALK_BRANDS,
  'هی‌بال':        SNOOKER_CHALK_BRANDS,
  'پاکت بیلیارد': ['Taom', 'Kamui', 'Predator', 'Master', 'Triangle', 'Blue Diamond', 'Silver Cup', 'Tiger', 'Molinari', 'Navigator', 'HOW', 'Mezz', 'Outsville', 'Great White', 'Lava', 'Magic Chalk', 'Pagulayan', 'Turning Point', 'Triple 60', 'Viking'],
}
const CHALK_MODELS: Record<string, Record<string, string[]>> = {
  'اسنوکر': SNOOKER_CHALK_MODELS,
  'هی‌بال':  SNOOKER_CHALK_MODELS,
  'پاکت بیلیارد': {
    'Taom':          ['V10', 'Pyro', 'Pool Chalk 2.0', 'Soft'],
    'Kamui':         ['Roku', '0.98', '1.21', 'Sai', 'Kageki'],
    'Predator':      ['1080', '1080 Pure'],
    'Master':        ['Master Chalk'],
    'Triangle':      ['Triangle Chalk', 'Triangle Pro'],
    'Blue Diamond':  ['Blue Diamond'],
    'Silver Cup':    ['Silver Cup'],
    'Tiger':         ['Tiger Chalk'],
    'Molinari':      ['Molinari Chalk'],
    'Navigator':     ['Navigator Chalk'],
    'HOW':           ['HOW Chalk'],
    'Mezz':          ['Smart Chalk'],
    'Outsville':     ['TechnoDud'],
    'Great White':   ['Great White Chalk'],
    'Lava':          ['Lava Chalk'],
    'Magic Chalk':   ['Magic Chalk'],
    'Pagulayan':     ['Pagulayan Chalk'],
    'Turning Point': ['TP Chalk'],
    'Triple 60':     ['Triple 60 Chalk'],
    'Viking':        ['Viking Chalk'],
  },
}

/* دسته‌های نوع‌محور. برند بر اساس نوع؛ مدل بر اساس (نوع، برند) — به‌جز چوب که مدلش فقط بر اساس برند است. */
const TYPE_BRANDS: Record<string, Record<string, string[]>> = { cue: CUE_BRANDS, table: TABLE_BRANDS, tip: TIP_BRANDS, chalk: CHALK_BRANDS }
const TYPE_MODELS: Record<string, Record<string, Record<string, string[]>>> = { table: TABLE_MODELS, tip: TIP_MODELS, chalk: CHALK_MODELS }

/* ── نیمه‌ی جامانده‌ی تفکیکِ «کیس و کیف» ──
   دسته‌ی قدیمیِ `case-bag` در `lib/market/categories` به دو دسته‌ی
   `cue-case` (کیس چوب) و `ball-bag` (کیف توپ) شکسته شد، ولی
   فهرست‌های نوع/برند/مدل با کلیدِ قدیمی مانده بودند. نتیجه این بود
   که انتخابِ «کیس چوب» در فرم، نه فهرستِ نوع می‌آورد و نه فهرستِ
   برند — هر دو به متنِ آزاد می‌افتادند. */
for (const alias of ['cue-case', 'ball-bag']) {
  TYPE_OPTIONS[alias]  ??= TYPE_OPTIONS['case-bag']!
  CAT_BRANDS[alias]    ??= CAT_BRANDS['case-bag']!
  CAT_MODELS[alias]    ??= CAT_MODELS['case-bag']!
}

/** دسته‌ای که برندش به «نوع» وابسته است (چوب/میز/تیپ/گچ) */
export const isTypeDrivenCategory = (category: string): boolean => !!TYPE_BRANDS[category]

/** «سایر» را یک‌بار ته لیست تضمین می‌کند (چه در داده باشد چه نباشد) */
export const withOther = (arr: string[]): string[] => (arr.includes('سایر') ? arr : [...arr, 'سایر'])

/** فهرستِ برند برای (دسته، نوع) — `null` یعنی متنِ آزاد */
export function brandOptionsFor(category: string, type: string): string[] | null {
  return TYPE_BRANDS[category]
    ? (TYPE_BRANDS[category]![type] ?? null)   // نوع‌محور (چوب/میز/تیپ/گچ)
    : (CAT_BRANDS[category] ?? null)            // برند ثابت همان دسته
}

/** فهرستِ مدل برای (دسته، نوع، برند) — `null` یعنی متنِ آزاد */
export function modelOptionsFor(category: string, type: string, brand: string): string[] | null {
  if (category === 'cue') return CUE_MODELS[brand] ?? null   // چوب: مدل فقط بر اساس برند
  if (TYPE_MODELS[category]) return TYPE_MODELS[category]![type]?.[brand] ?? null
  return CAT_MODELS[category]?.[brand] ?? null
}
