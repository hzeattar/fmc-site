<?php
require_once __DIR__ . '/config.php';

/*
 * Mailer — uses Resend REST API
 * Requires: RESEND_API_KEY environment variable
 */
class Mailer {

    /* ─── Transport ─────────────────────────────────────────── */

    private static function apiKey(): string {
        return getenv('RESEND_API_KEY') ?: '';
    }

    private static function sendRequest(array $payload): bool {
        $apiKey = self::apiKey();
        if (empty($apiKey)) {
            error_log('MAIL ERROR: RESEND_API_KEY not set');
            return false;
        }
        $result = self::rawSend($apiKey, $payload);
        if ($result['ok']) return true;

        /* Auto-fallback: if domain not verified, retry with Resend test sender */
        if ($result['code'] === 403 && strpos($result['body'], 'not verified') !== false) {
            error_log('MAIL: domain not verified, retrying with onboarding@resend.dev');
            $payload['from'] = 'FMC <onboarding@resend.dev>';
            $retry = self::rawSend($apiKey, $payload);
            if ($retry['ok']) return true;
            error_log("MAIL RESEND FALLBACK ERROR {$retry['code']}: {$retry['body']}");
            return false;
        }

        error_log("MAIL RESEND ERROR {$result['code']}: {$result['body']}");
        return false;
    }

    private static function rawSend(string $apiKey, array $payload): array {
        $json = json_encode($payload);
        $ch   = curl_init('https://api.resend.com/emails');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $json,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_FOLLOWLOCATION => false,
        ]);
        $response = curl_exec($ch);
        $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err      = curl_error($ch);
        @curl_close($ch);
        if ($err) return ['ok' => false, 'code' => 0, 'body' => 'CURL: ' . $err];
        $ok = ($code >= 200 && $code < 300 && !empty(json_decode($response, true)['id']));
        return ['ok' => $ok, 'code' => $code, 'body' => $response];
    }

    /** Returns ['ok'=>bool, 'code'=>int, 'body'=>string] for debugging */
    public static function sendDebug(string $to, string $subject, string $html, string $text = ''): array {
        return self::sendDebugFrom(FROM_EMAIL, $to, $subject, $html, $text);
    }

    public static function sendDebugFrom(string $from, string $to, string $subject, string $html, string $text = ''): array {
        $apiKey = self::apiKey();
        if (empty($apiKey)) return ['ok' => false, 'code' => 0, 'body' => 'RESEND_API_KEY not set'];
        $payload = json_encode(['from' => $from, 'to' => [$to], 'subject' => $subject, 'html' => $html, 'text' => $text ?: strip_tags($html)]);
        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $apiKey, 'Content-Type: application/json'], CURLOPT_TIMEOUT => 15, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2]);
        $response = curl_exec($ch);
        $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        @curl_close($ch);
        if ($curlErr) return ['ok' => false, 'code' => 0, 'body' => 'CURL: ' . $curlErr];
        $ok = ($code >= 200 && $code < 300 && !empty(json_decode($response, true)['id']));
        return ['ok' => $ok, 'code' => $code, 'body' => $response];
    }

    public static function send(string $to, string $subject, string $html, string $text = ''): bool {
        return self::sendRequest([
            'from'    => str_contains(FROM_EMAIL, '<') ? FROM_EMAIL : 'FMC <' . FROM_EMAIL . '>',
            'to'      => [$to],
            'subject' => $subject,
            'html'    => $html,
            'text'    => $text ?: strip_tags($html),
        ]);
    }

    /* ─── Shared Layout ─────────────────────────────────────── */

    private static function wrap(string $body): string {
        return '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Financial Monitoring Commission</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#eef2f7">
<tr><td align="center" style="padding:40px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:10px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.12)">

  <!-- HEADER -->
  <tr>
    <td bgcolor="#0c2340" style="padding:26px 36px">
      <table cellpadding="0" cellspacing="0" width="100%"><tr>
        <td>
          <div style="color:#fff;font-size:19px;font-weight:bold;letter-spacing:.4px">Financial Monitoring Commission</div>
          <div style="color:#7aafd4;font-size:11px;margin-top:3px;letter-spacing:.9px;text-transform:uppercase">Regulatory Oversight Authority</div>
        </td>
        <td align="right" valign="middle">
          <div style="width:38px;height:38px;background:#c9a227;border-radius:50%;text-align:center;line-height:38px;font-size:17px;font-weight:bold;color:#0c2340">F</div>
        </td>
      </tr></table>
    </td>
  </tr>
  <!-- GOLD BAR -->
  <tr><td height="4" bgcolor="#c9a227" style="font-size:0;line-height:0">&nbsp;</td></tr>

  <!-- BODY -->
  <tr><td bgcolor="#ffffff" style="padding:36px 36px 28px">' . $body . '</td></tr>

  <!-- FOOTER -->
  <tr>
    <td bgcolor="#f0f4f8" style="padding:18px 36px;border-top:1px solid #dde5ef">
      <p style="margin:0;font-size:12px;color:#94a3b8">Financial Monitoring Commission &mdash; <a href="https://fmc-gov.com" style="color:#94a3b8;text-decoration:none">fmc-gov.com</a></p>
      <p style="margin:4px 0 0;font-size:11px;color:#b0bac6">This is an automated notification. Do not reply directly to this email.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>';
    }

    private static function btn(string $href, string $label, string $bg = '#1e4fa3'): string {
        return '<a href="' . htmlspecialchars($href) . '" style="display:inline-block;padding:13px 28px;background:' . $bg . ';color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;letter-spacing:.3px;margin-top:20px">' . htmlspecialchars($label) . '</a>';
    }

    private static function refBox(string $ref): string {
        return '<div style="background:#f0f6ff;border-left:4px solid #1e4fa3;border-radius:0 6px 6px 0;padding:14px 18px;margin:20px 0">
<div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px">Case Reference Number</div>
<div style="font-size:22px;font-weight:bold;color:#0c2340;letter-spacing:1px">' . htmlspecialchars($ref) . '</div>
</div>';
    }

    private static function badge(string $label, string $color): string {
        return '<span style="display:inline-block;padding:5px 16px;background:' . $color . ';color:#fff;border-radius:20px;font-size:13px;font-weight:bold;letter-spacing:.3px">' . htmlspecialchars($label) . '</span>';
    }

    private static function stateInfo(string $state): array {
        $map = [
            'received' => ['label' => 'Complaint Received',       'color' => '#2563eb', 'desc' => 'Your complaint has been received and logged. A case officer will be assigned shortly.'],
            'review'   => ['label' => 'Under Review',             'color' => '#7c3aed', 'desc' => 'Your case is under active review by our investigations team.'],
            'call'     => ['label' => 'Call Scheduled',           'color' => '#d97706', 'desc' => 'A call has been scheduled with your case officer. Please see the details below.'],
            'info'     => ['label' => 'Information Requested',    'color' => '#dc2626', 'desc' => 'Additional information or documents are required. Please review the items listed below and submit them through your case portal.'],
            'decision' => ['label' => 'Decision Reached',         'color' => '#059669', 'desc' => 'The Commission has reviewed all evidence and reached a formal decision on your complaint.'],
            'closed'   => ['label' => 'Case Closed',              'color' => '#475569', 'desc' => 'Your complaint case has been formally closed. Thank you for contacting the Financial Monitoring Commission.'],
        ];
        return $map[$state] ?? ['label' => ucfirst($state), 'color' => '#64748b', 'desc' => ''];
    }

    /* ─── Public Methods ────────────────────────────────────── */

    /**
     * Confirmation email sent to complainant immediately after submission.
     */
    public static function complaintConfirmation(string $to, string $ref, string $name): bool {
        $link    = rtrim(APP_URL, '/') . '/pages/track.html?ref=' . urlencode($ref);
        $subject = 'FMC — Complaint Received · Ref ' . $ref;

        $body = '<h2 style="margin:0 0 6px;color:#0c2340;font-size:22px">Your complaint has been received</h2>
<p style="margin:0 0 20px;color:#475569;font-size:15px">Hello <strong>' . htmlspecialchars($name) . '</strong>, thank you for contacting the Financial Monitoring Commission.</p>

' . self::refBox($ref) . '

<p style="color:#374151;font-size:14px;line-height:1.75;margin:0 0 10px">
Your complaint has been <strong>logged and queued</strong> for review. A case officer will be assigned within 1&ndash;3 business days.
</p>
<p style="color:#374151;font-size:14px;line-height:1.75;margin:0">
You will receive an email notification each time the status of your case is updated. You can also track progress at any time using the button below.
</p>

' . self::btn($link, 'Track Your Complaint') . '

<hr style="border:none;border-top:1px solid #e5eaf0;margin:28px 0 20px">
<p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0">
Please keep this email — your reference number is required for all future correspondence.<br>
If you did not submit this complaint, please disregard this message.
</p>';

        $text = "FMC — Complaint Received\n\nHello {$name},\nYour complaint has been received.\nReference: {$ref}\n\nTrack: {$link}\n\nFinancial Monitoring Commission";
        return self::send($to, $subject, self::wrap($body), $text);
    }

    /**
     * Alert sent to admin staff when a new complaint is submitted.
     */
    public static function staffNotification(string $ref, string $complainantName = '', string $firmName = ''): bool {
        $link    = rtrim(APP_URL, '/') . '/pages/admin.html';
        $subject = 'FMC Admin — New Complaint · ' . $ref;

        $rows = '';
        if ($complainantName) $rows .= '<tr><td style="color:#64748b;font-size:13px;padding:7px 0;border-bottom:1px solid #f1f5f9;white-space:nowrap">Complainant</td><td style="color:#0f172a;font-size:13px;padding:7px 0 7px 14px;border-bottom:1px solid #f1f5f9"><strong>' . htmlspecialchars($complainantName) . '</strong></td></tr>';
        if ($firmName)       $rows .= '<tr><td style="color:#64748b;font-size:13px;padding:7px 0;white-space:nowrap">Firm</td><td style="color:#0f172a;font-size:13px;padding:7px 0 0 14px"><strong>' . htmlspecialchars($firmName) . '</strong></td></tr>';

        $body = '<h2 style="margin:0 0 6px;color:#0c2340;font-size:20px">New complaint submitted</h2>
<p style="margin:0 0 20px;color:#475569;font-size:14px">A new complaint requires your attention.</p>

' . self::refBox($ref) . '

' . ($rows ? '<table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px">' . $rows . '</table>' : '') . '

' . self::btn($link, 'Open Admin Dashboard', '#0c2340') . '

<p style="color:#94a3b8;font-size:12px;margin-top:22px;line-height:1.6">Log in to review, assign and respond to this complaint.</p>';

        $text = "FMC — New Complaint\nReference: {$ref}\n\nDashboard: {$link}";
        return self::send(ADMIN_NOTIFY_EMAIL, $subject, self::wrap($body), $text);
    }

    /**
     * State-change notification sent to complainant when admin updates the case.
     *
     * @param string $ref
     * @param string $to         Complainant email
     * @param string $name       Complainant full name
     * @param string $newState   Frontend state key: received|review|call|info|decision|closed
     * @param array  $extra      Context: ['appointment'=>..., 'infoRequest'=>..., 'decision'=>...]
     */
    public static function stateChange(
        string $ref,
        string $to,
        string $name,
        string $newState,
        array  $extra = []
    ): bool {
        if (!$to) return false;
        $info    = self::stateInfo($newState);
        $link    = rtrim(APP_URL, '/') . '/pages/track.html?ref=' . urlencode($ref);
        $subject = 'FMC — Case Update: ' . $info['label'] . ' · Ref ' . $ref;

        /* State-specific detail block */
        $detail = '';

        if ($newState === 'call' && !empty($extra['appointment']['dateText'])) {
            $ap      = $extra['appointment'];
            $detail  = '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:16px;margin:18px 0">';
            $detail .= '<div style="font-size:11px;color:#92400e;text-transform:uppercase;letter-spacing:.6px;font-weight:bold;margin-bottom:8px">Scheduled Call</div>';
            $detail .= '<div style="font-size:17px;color:#78350f;font-weight:bold">' . htmlspecialchars($ap['dateText']) . '</div>';
            if (!empty($ap['note'])) $detail .= '<div style="font-size:13px;color:#92400e;margin-top:8px;line-height:1.5">' . htmlspecialchars($ap['note']) . '</div>';
            $detail .= '<div style="font-size:12px;color:#a16207;margin-top:10px;padding-top:10px;border-top:1px solid #fde68a">Please ensure you are available at this time. Missing a scheduled call may result in the case being placed on hold.</div>';
            $detail .= '</div>';
        }

        if ($newState === 'info' && !empty($extra['infoRequest'])) {
            $ir    = $extra['infoRequest'];
            $items = array_filter((array)($ir['items'] ?? []));
            if ($items || !empty($ir['note'])) {
                $detail  = '<div style="background:#fff1f2;border:1px solid #fca5a5;border-radius:6px;padding:16px;margin:18px 0">';
                $detail .= '<div style="font-size:11px;color:#991b1b;text-transform:uppercase;letter-spacing:.6px;font-weight:bold;margin-bottom:10px">Documents / Information Required</div>';
                if ($items) {
                    $detail .= '<ul style="margin:0 0 8px;padding-left:20px">';
                    foreach ($items as $it) $detail .= '<li style="font-size:13px;color:#7f1d1d;margin-bottom:5px;line-height:1.5">' . htmlspecialchars($it) . '</li>';
                    $detail .= '</ul>';
                }
                if (!empty($ir['note'])) $detail .= '<div style="font-size:13px;color:#991b1b;margin-top:8px;line-height:1.5">' . htmlspecialchars($ir['note']) . '</div>';
                $detail .= '</div>';
            }
        }

        if ($newState === 'decision' && !empty($extra['decision'])) {
            $dec     = $extra['decision'];
            $detail  = '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:16px;margin:18px 0">';
            $detail .= '<div style="font-size:11px;color:#14532d;text-transform:uppercase;letter-spacing:.6px;font-weight:bold;margin-bottom:10px">Committee Decision</div>';
            if (!empty($dec['text'])) $detail .= '<p style="font-size:14px;color:#166534;margin:0 0 10px;line-height:1.7">' . nl2br(htmlspecialchars($dec['text'])) . '</p>';
            $pay = $dec['payment'] ?? [];
            if (!empty($pay['enabled'])) {
                $amt     = htmlspecialchars(($pay['currency'] ?? 'GBP') . ' ' . ($pay['amount'] ?? '0'));
                $detail .= '<div style="background:#dcfce7;border-radius:4px;padding:10px 14px;font-size:13px;color:#15803d"><strong>Payment Required:</strong> ' . $amt . ' &mdash; Please log in to view payment instructions.</div>';
            }
            $detail .= '</div>';
        }

        $salutation = $name ? 'Hello <strong>' . htmlspecialchars($name) . '</strong>,' : 'Hello,';

        $body = '<h2 style="margin:0 0 6px;color:#0c2340;font-size:20px">Your case status has been updated</h2>
<p style="margin:0 0 20px;color:#475569;font-size:14px">' . $salutation . ' there is a new update on your complaint.</p>

' . self::refBox($ref) . '

<div style="margin:16px 0 8px">
  <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">New Status</div>
  ' . self::badge($info['label'], $info['color']) . '
</div>
<p style="color:#374151;font-size:14px;line-height:1.75;margin:16px 0 0">' . htmlspecialchars($info['desc']) . '</p>

' . $detail . '

' . self::btn($link, 'View Case Details') . '

<hr style="border:none;border-top:1px solid #e5eaf0;margin:28px 0 20px">
<p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0">
To reply or upload additional documents, please use the case portal link above.<br>
Reference: <strong>' . htmlspecialchars($ref) . '</strong>
</p>';

        $text = "FMC — Case Update: {$info['label']}\n\nReference: {$ref}\nNew Status: {$info['label']}\n\n{$info['desc']}\n\nView case: {$link}\n\nFinancial Monitoring Commission";
        return self::send($to, $subject, self::wrap($body), $text);
    }

    /**
     * Legacy method — maps DB status to stateChange().
     */
    public static function statusUpdate(string $to, string $ref, string $status): bool {
        $map = ['pending' => 'received', 'under_review' => 'review', 'resolved' => 'decision', 'closed' => 'closed', 'payment_required' => 'decision'];
        return self::stateChange($ref, $to, '', $map[$status] ?? 'received');
    }
}
