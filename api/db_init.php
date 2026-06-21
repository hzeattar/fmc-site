<?php
require_once __DIR__ . '/../inc/db.php';

$secret = $_GET['secret'] ?? '';
if ($secret !== (getenv('DB_INIT_SECRET') ?: 'fmc-init-2026')) {
    http_response_code(403);
    jsonOut(['ok' => false, 'error' => 'Forbidden']);
}

try {
    $pdo = DB::pdo();

    // Drop old tables if exist (from previous PHP backend)
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $tables = [
        'fmc_messages','fmc_payments','fmc_audit_log','fmc_complaints','fmc_companies','fmc_admins'
    ];
    foreach ($tables as $table) {
        $pdo->exec("DROP TABLE IF EXISTS {$table}");
    }
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    // Create schema - read from file
    $schemaFile = __DIR__ . '/../sql/schema.sql';
    if (!file_exists($schemaFile)) {
        throw new Exception('Schema file not found');
    }
    $sql = file_get_contents($schemaFile);
    $pdo->exec($sql);

    // Seed companies (108 fake companies matching frontend static data)
    $companies = [
        // Investment firms
        ['Al Khair Capital','LK-001','active','Investment Firm','SEC','Investment','medium','United States',2008],
        ['Alpha Global Investments','AL-002','active','Investment Firm','FCA','Investment','medium','United Kingdom',2005],
        ['Bain Capital','BA-003','active','Private Equity','SEC','Investment','low','United States',1984],
        ['BlackRock','BL-004','active','Investment Firm','SEC','Investment','low','United States',1988],
        ['Bridgewater Associates','BR-005','active','Hedge Fund','SEC','Hedge Fund','medium','United States',1975],
        ['Carlyle Group','CA-006','active','Private Equity','SEC','Private Equity','low','United States',1987],
        ['Citadel','CI-007','active','Hedge Fund','SEC','Hedge Fund','medium','United States',1990],
        ['Fidelity Investments','FI-008','active','Investment Firm','SEC','Investment','low','United States',1946],
        ['Goldman Sachs','GO-009','active','Investment Bank','SEC','Investment Bank','low','United States',1869],
        ['JP Morgan Asset Management','JP-010','active','Investment Firm','SEC','Investment','low','United States',1871],
        ['Lone Star Funds','LO-011','active','Private Equity','SEC','Private Equity','medium','United States',1995],
        ['Magnetar Capital','MA-012','active','Hedge Fund','SEC','Hedge Fund','medium','United States',2005],
        ['Oaktree Capital','OA-013','active','Investment Firm','SEC','Investment','low','United States',1995],
        ['Renaissance Technologies','RE-014','active','Hedge Fund','SEC','Hedge Fund','low','United States',1982],
        ['SeaTown Holdings','SE-015','active','Investment Firm','MAS','Investment','medium','Singapore',2011],
        ['Temasek Holdings','TE-016','active','Sovereign Wealth','MAS','Investment','low','Singapore',1974],
        ['Two Sigma','TW-017','active','Hedge Fund','SEC','Hedge Fund','medium','United States',2001],
        ['Viking Global Investors','VI-018','active','Hedge Fund','SEC','Hedge Fund','medium','United States',1999],
        ['Warburg Pincus','WA-019','active','Private Equity','SEC','Private Equity','low','United States',1966],
        ['Elliott Management','EL-020','active','Hedge Fund','SEC','Hedge Fund','high','United States',1977],
        // Banks
        ['Wells Fargo','WF-021','active','Bank','OCC / FDIC','Bank','medium','United States',1852],
        ['HSBC Bank','HS-022','active','Bank','FCA / PRA','Bank','low','United Kingdom',1865],
        ['Deutsche Bank','DB-023','active','Bank','BaFin','Bank','medium','Germany',1870],
        ['Barclays','BA-024','active','Bank','FCA / PRA','Bank','low','United Kingdom',1690],
        ['Credit Suisse','CS-025','frozen','Bank','FINMA','Bank','high','Switzerland',1856],
        ['UBS Group','UB-026','active','Bank','FINMA','Bank','low','Switzerland',1862],
        ['Societe Generale','SG-027','active','Bank','ACPR','Bank','medium','France',1864],
        ['Santander','SA-028','active','Bank','BDE','Bank','low','Spain',1857],
        ['Commerzbank','CO-029','active','Bank','BaFin','Bank','medium','Germany',1870],
        ['ABN AMRO','AB-030','active','Bank','DNB','Bank','low','Netherlands',1991],
        // Crypto exchanges
        ['Binance','BI-031','frozen','Crypto','FCA','Crypto','high','Malta',2017],
        ['Coinbase','CO-032','active','Crypto','SEC','Crypto','medium','United States',2012],
        ['Kraken','KR-033','active','Crypto','FinCEN','Crypto','medium','United States',2011],
        ['Bitstamp','BI-034','active','Crypto','FCA','Crypto','medium','United Kingdom',2011],
        ['Gemini','GE-035','active','Crypto','NYDFS','Crypto','low','United States',2014],
        ['Bitfinex','BI-036','frozen','Crypto','N/A','Crypto','high','Hong Kong',2012],
        ['OKX','OK-037','active','Crypto','FCA','Crypto','medium','Seychelles',2017],
        ['Bybit','BY-038','active','Crypto','MAS','Crypto','medium','Singapore',2018],
        ['Huobi','HU-039','active','Crypto','MAS','Crypto','medium','Seychelles',2013],
        ['KuCoin','KU-040','active','Crypto','N/A','Crypto','medium','Seychelles',2017],
        ['Gate.io','GA-041','active','Crypto','N/A','Crypto','medium','Cayman',2013],
        ['Crypto.com','CR-042','active','Crypto','FCA','Crypto','medium','Singapore',2016],
        ['Bitget','BI-043','active','Crypto','MAS','Crypto','medium','Singapore',2018],
        ['MEXC','ME-044','active','Crypto','N/A','Crypto','medium','Seychelles',2018],
        // Forex / CFD
        ['IG Group','IG-045','active','Forex / CFD','FCA','Broker','low','United Kingdom',1974],
        ['Saxo Bank','SA-046','active','Bank / Broker','FCA','Broker','low','Denmark',1992],
        ['Plus500','PL-047','active','CFD','FCA','Broker','low','Israel',2008],
        ['XM','XM-048','active','Forex','CySEC','Broker','medium','Cyprus',2009],
        ['AvaTrade','AV-049','active','Forex','CBI','Broker','medium','Ireland',2006],
        ['Pepperstone','PE-050','active','Forex','ASIC','Broker','low','Australia',2010],
        ['Tickmill','TI-051','active','Forex','FCA','Broker','medium','United Kingdom',2014],
        ['Vantage','VA-052','active','Forex','ASIC','Broker','medium','Australia',2009],
        ['IC Markets','IC-053','active','Forex','ASIC','Broker','low','Australia',2007],
        ['FBS','FB-054','active','Forex','IFSC','Broker','medium','Belize',2009],
        // Insurance
        ['AXA','AX-055','active','Insurance','ACPR','Insurance','low','France',1816],
        ['Allianz','AL-056','active','Insurance','BaFin','Insurance','low','Germany',1890],
        ['MetLife','ME-057','active','Insurance','SEC','Insurance','low','United States',1868],
        ['Prudential','PR-058','active','Insurance','PRA','Insurance','low','United Kingdom',1848],
        ['Generali','GE-059','active','Insurance','IVASS','Insurance','low','Italy',1831],
        ['Munich Re','MU-060','active','Reinsurance','BaFin','Insurance','low','Germany',1880],
        ['Swiss Re','SW-061','active','Reinsurance','FINMA','Insurance','low','Switzerland',1863],
        ['Zurich Insurance','ZU-062','active','Insurance','FINMA','Insurance','low','Switzerland',1872],
        ['AIG','AI-063','active','Insurance','SEC','Insurance','medium','United States',1919],
        ['Chubb','CH-064','active','Insurance','SEC','Insurance','low','United States',1882],
        // Payment services
        ['Stripe','ST-065','active','Payment Service','FCA','Payment','low','United States',2010],
        ['Adyen','AD-066','active','Payment Service','DNB','Payment','low','Netherlands',2006],
        ['Square','SQ-067','active','Payment Service','FCA','Payment','low','United States',2009],
        ['Wise','WI-068','active','Payment Service','FCA','Payment','low','United Kingdom',2011],
        ['Payoneer','PA-069','active','Payment Service','FCA','Payment','medium','United States',2005],
        ['Skrill','SK-070','active','Payment Service','FCA','Payment','medium','United Kingdom',2001],
        ['Neteller','NE-071','active','Payment Service','FCA','Payment','medium','United Kingdom',1999],
        ['PayPal','PA-072','active','Payment Service','FCA','Payment','low','United States',1998],
        ['Revolut','RE-073','active','Payment Service','FCA','Payment','medium','United Kingdom',2015],
        ['Klarna','KL-074','active','Payment Service','FCA','Payment','low','Sweden',2005],
        // FX money transfer
        ['Western Union','WE-075','active','Money Transfer','FCA','Payment','medium','United States',1851],
        ['MoneyGram','MO-076','active','Money Transfer','FCA','Payment','medium','United States',1940],
        ['Remitly','RE-077','active','Money Transfer','FCA','Payment','low','United States',2011],
        ['WorldRemit','WO-078','active','Money Transfer','FCA','Payment','low','United Kingdom',2010],
        ['Ria Money Transfer','RI-079','active','Money Transfer','FCA','Payment','medium','United States',1987],
        ['Xoom','XO-080','active','Money Transfer','FCA','Payment','low','United States',2001],
        ['OFX','OF-081','active','Money Transfer','ASIC','Payment','low','Australia',1998],
        ['TorFX','TO-082','active','Money Transfer','FCA','Payment','low','United Kingdom',2004],
        ['Currencies Direct','CU-083','active','Money Transfer','FCA','Payment','low','United Kingdom',1996],
        ['TransferGo','TR-084','active','Money Transfer','FCA','Payment','low','United Kingdom',2012],
        // Mortgage / lending
        ['Quicken Loans','QU-085','active','Mortgage / Lending','SEC','Lending','medium','United States',1985],
        ['AmeriHome','AM-086','active','Mortgage / Lending','SEC','Lending','medium','United States',2014],
        ['PrimeLending','PR-087','active','Mortgage / Lending','SEC','Lending','low','United States',1986],
        ['United Wholesale Mortgage','UN-088','active','Mortgage / Lending','SEC','Lending','low','United States',1986],
        ['Rocket Mortgage','RO-089','active','Mortgage / Lending','SEC','Lending','low','United States',1985],
        ['LoanDepot','LO-090','active','Mortgage / Lending','SEC','Lending','medium','United States',2010],
        ['Pennymac','PE-091','active','Mortgage / Lending','SEC','Lending','low','United States',2008],
        ['Newrez','NE-092','active','Mortgage / Lending','SEC','Lending','medium','United States',2008],
        ['Flagstar Bank','FL-093','active','Bank','FDIC','Bank','medium','United States',1987],
        ['Mr. Cooper','MR-094','active','Mortgage Service','SEC','Lending','medium','United States',1994],
        // Wealth / robo
        ['Betterment','BE-095','active','Wealth Management','SEC','Wealth','low','United States',2008],
        ['Wealthfront','WE-096','active','Wealth Management','SEC','Wealth','low','United States',2008],
        ['Personal Capital','PE-097','active','Wealth Management','SEC','Wealth','low','United States',2009],
        ['Schwab Intelligent','SC-098','active','Wealth Management','SEC','Wealth','low','United States',1971],
        ['Vanguard Personal','VA-099','active','Wealth Management','SEC','Wealth','low','United States',1975],
        ['SoFi Invest','SO-100','active','Brokerage','SEC','Broker','medium','United States',2011],
        ['Robinhood','RO-101','active','Brokerage','SEC','Broker','high','United States',2013],
        ['Acorns','AC-102','active','Wealth Management','SEC','Wealth','low','United States',2012],
        ['Stash','ST-103','active','Wealth Management','SEC','Wealth','medium','United States',2015],
        ['M1 Finance','M1-104','active','Wealth Management','SEC','Wealth','low','United States',2015],
        // Remaining to hit ~108
        ['MicroStrategy','MI-105','active','Corporate','SEC','Investment','medium','United States',1989],
        ['Tesla Inc','TE-106','active','Corporate','SEC','Corporate','low','United States',2003],
        ['CoinShares','CO-107','active','Investment Firm','FCA','Investment','medium','United Kingdom',2014],
        ['21Shares','21-108','active','ETF','FINMA','Investment','medium','Switzerland',2018],
        ['Grayscale Investments','GR-109','active','Investment Firm','SEC','Investment','medium','United States',2013],
        ['3i Group','3i-110','active','Investment Firm','FCA','Investment','low','United Kingdom',1945],
        ['Airbnb','AI-111','active','Corporate','SEC','Corporate','medium','United States',2008],
        ['Booking Holdings','BO-112','active','Corporate','SEC','Corporate','low','United States',1997],
        ['Delivery Hero','DE-113','active','Corporate','BaFin','Corporate','medium','Germany',2011],
        ['Grab Holdings','GR-114','active','Corporate','MAS','Corporate','medium','Singapore',2012],
        ['GoTo Group','GO-115','active','Corporate','OJK','Corporate','medium','Indonesia',2021],
        ['Meituan','ME-116','active','Corporate','CSRC','Corporate','low','China',2010],
        ['Rakuten','RA-117','active','Corporate','FSA','Corporate','low','Japan',1997],
        ['SEA Ltd','SE-118','active','Corporate','MAS','Corporate','medium','Singapore',2009],
        ['Tencent Music','TE-119','active','Corporate','CSRC','Corporate','low','China',2016],
        ['Trip.com','TR-120','active','Corporate','CSRC','Corporate','low','China',1999],
        ['Uber Technologies','UB-121','active','Corporate','SEC','Corporate','medium','United States',2009],
        ['Yandex','YA-122','active','Corporate','CBR','Corporate','high','Russia',1997],
        ['Zomato','ZO-123','active','Corporate','SEBI','Corporate','medium','India',2008],
    ];

    $insert = $pdo->prepare("INSERT INTO fmc_companies
        (name, license_number, status, category, regulator, type, risk, country, year_founded)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

    foreach ($companies as $c) {
        try {
            $insert->execute($c);
        } catch (PDOException $e) {
            // Ignore duplicates
        }
    }

    // Insert default admin (password will be set via env var, but we'll hash one here for reference)
    $pass = getenv('ADMIN_PASSWORD') ?: 'FmcAdmin2026!';
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $pdo->prepare(
        "INSERT INTO fmc_admins (name, email, username, password_hash, role, status)
         VALUES ('Administrator', 'admin@fmc-gov.com', 'admin', ?, 'super', 'active')
         ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), status='active'"
    )->execute([$hash]);

    jsonOut([
        'ok' => true,
        'message' => 'Database initialized successfully',
        'companies' => count($companies),
    ]);
} catch (Exception $e) {
    error_log("INIT ERROR: " . $e->getMessage());
    jsonOut(['ok' => false, 'error' => $e->getMessage()], 500);
}
