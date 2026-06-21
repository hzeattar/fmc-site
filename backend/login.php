<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FMC Admin</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:32px;width:100%;max-width:360px;box-shadow:0 25px 50px -12px rgba(0,0,0,.5)}
h1{margin:0 0 20px;font-size:20px;color:#f8fafc;text-align:center}
label{display:block;margin:16px 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8}
input{width:100%;padding:10px 12px;border:1px solid #334155;border-radius:6px;background:#0f172a;color:#f1f5f9;font-size:14px}
input:focus{outline:none;border-color:#3b82f6}
button{width:100%;margin-top:20px;padding:11px;border:none;border-radius:6px;background:#2563eb;color:#fff;font-weight:600;cursor:pointer}
button:hover{background:#1d4ed8}
.error{background:#450a0a;border:1px solid #7f1d1d;color:#fca5a5;padding:10px 12px;border-radius:6px;font-size:13px;margin-bottom:12px;display:none}
</style>
</head>
<body>
<div class="card">
  <h1>FMC Admin Login</h1>
  <div class="error" id="err">Invalid credentials</div>
  <form method="POST" action="/backend/login.php" id="form">
    <label>Username</label>
    <input type="text" name="username" required placeholder="admin" value="admin">
    <label>Password</label>
    <input type="password" name="password" required placeholder="Enter password">
    <button type="submit">Sign In</button>
  </form>
</div>
<script>
document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const res = await fetch('/api/admin_login.php', {method:'POST', body: JSON.stringify(Object.fromEntries(fd)), headers:{'Content-Type':'application/json'}});
  const data = await res.json();
  if(data.ok){ location.href='/backend/index.php'; }
  else { document.getElementById('err').style.display='block'; document.getElementById('err').textContent = data.error||'Invalid credentials'; }
});
</script>
</body>
</html>
