<?php
require_once __DIR__ . '/config.php';

/*
 * Mailer — uses Resend REST API (much more reliable than raw SMTP)
 * Requires: RESEND_API_KEY environment variable
 */
class Mailer {
    private static function apiKey(): string {
        return getenv('RESEND_API_KEY') ?: '';
    }

    private static function sendRequest(array $payload): bool {
        $apiKey = self::apiKey();
        if (empty($apiKey)) {
            error_log('MAIL ERROR: RESEND_API_KEY not set');
            return false;
        }

        $json = json_encode($payload);
        $ch = curl_init('https://api.resend.com/emails');
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
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            error_log("MAIL CURL ERROR: {$err}");
            return false;
        }
        if ($code >= 200 && $code < 300) {
            $data = json_decode($response, true);
            if (!empty($data['id'])) {
                return true;
            }
        }
        error_log("MAIL RESEND ERROR {$code}: {$response}");
        return false;
    }

    public static function send(string $to, string $subject, string $html, string $text = ''): bool {
        return self::sendRequest([
            'from'    => FROM_EMAIL,
            'to'      => [$to],
            'subject' => $subject,
            'html'    => $html,
            'text'    => $text ?: strip_tags($html),
        ]);
    }

    public static function complaintConfirmation(string $to, string $ref, string $name): bool {
        $link = rtrim(APP_URL, '/') . '/pages/track.html?ref=' . urlencode($ref);
        $subject = 'Complaint Received - Reference #' . $ref;
        $html = "<html><body style='font-family:Arial,sans-serif;line-height:1.6;color:#333'>
<h2 style='color:#1d4f91'>FMC Complaint Confirmation</h2>
<p>Hello " . htmlspecialchars($name) . ",</p>
<p>Your complaint has been received successfully. Your reference number is:</p>
<div style='padding:12px 16px;background:#f1f5f9;border-radius:8px;margin:16px 0'>
<h3 style='margin:0;color:#1e3a8a;font-size:20px'>" . htmlspecialchars($ref) . "</h3>
</div>
<p><a href='{$link}' style='display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px'>Track Complaint</a></p>
<p style='font-size:12px;color:#666'>Financial Monitoring Commission</p>
</body></html>";
        $text = "FMC Complaint Confirmation\n\nReference: {$ref}\n\nTrack: {$link}\n\nFinancial Monitoring Commission";
        return self::send($to, $subject, $html, $text);
    }

    public static function staffNotification(string $ref): bool {
        $link = rtrim(APP_URL, '/') . '/pages/track.html?id=' . urlencode($ref);
        $subject = 'New Complaint Submitted - Ref #' . $ref;
        $html = "<html><body style='font-family:Arial,sans-serif'>
<h2 style='color:#d32f2f'>New Complaint Alert</h2>
<p>A new complaint has been submitted.</p>
<p><strong>Reference:</strong> " . htmlspecialchars($ref) . "</p>
<p><a href='{$link}' style='display:inline-block;padding:8px 16px;background:#d32f2f;color:#fff;text-decoration:none;border-radius:6px'>View Complaint</a></p>
</body></html>";
        $text = "New Complaint\n\nReference: {$ref}\n\n{$link}\n";
        return self::send(ADMIN_NOTIFY_EMAIL, $subject, $html, $text);
    }

    public static function statusUpdate(string $to, string $ref, string $status): bool {
        $labels = [
            'pending' => 'Pending Review',
            'under_review' => 'Under Review',
            'resolved' => 'Resolved',
            'closed' => 'Closed',
            'payment_required' => 'Payment Required',
        ];
        $label = $labels[$status] ?? $status;
        $link = rtrim(APP_URL, '/') . '/pages/track.html?id=' . urlencode($ref);
        $subject = 'Complaint Status Update - Ref #' . $ref;
        $html = "<html><body style='font-family:Arial,sans-serif'>
<h2>Status Update</h2>
<p>Your complaint <strong>#" . htmlspecialchars($ref) . "</strong> status has been updated to:</p>
<div style='padding:12px 16px;background:#dbeafe;border-radius:8px;margin:16px 0'>
<h3 style='margin:0;color:#1e40af'>" . htmlspecialchars($label) . "</h3>
</div>
<p><a href='{$link}' style='display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px'>View Details</a></p>
</body></html>";
        $text = "Status Update\n\nComplaint: #{$ref}\nStatus: {$label}\n\n{$link}\n";
        return self::send($to, $subject, $html, $text);
    }
}
