<?php
/* Prompto85 backend.
   - Default: proxy chat/vision to Anthropic using ANTHROPIC_API_KEY from .env.
   - {"action":"image"}: render an image with OpenAI gpt-image-2 using OPENAI_API_KEY (optional).
   Keys live in ~/.env (outside the web root) and are never sent to the browser. */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

/* ---- health check (GET ?health=1) ---- */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && (isset($_GET['health']) && $_GET['health'] === '1')) {
  echo json_encode(array('ok'=>true, 'service'=>'prompto85'));
  exit;
}

function env_val($name) {
  if (getenv($name)) return trim(getenv($name));
  $home = isset($_SERVER['HOME']) ? $_SERVER['HOME'] : '';
  $cands = array($home ? $home.'/.env' : null, __DIR__.'/../../../.env', __DIR__.'/../../.env', __DIR__.'/../.env', __DIR__.'/.env');
  foreach ($cands as $p) {
    if (!$p || !is_readable($p)) continue;
    foreach (file($p, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
      $line = trim($line);
      if ($line === '' || $line[0] === '#') continue;
      if (stripos($line, $name) === 0) { $v = trim(substr($line, strpos($line, '=') + 1)); return trim($v, "\"'"); }
    }
  }
  return null;
}
function out($code, $arr){ http_response_code($code); echo json_encode($arr); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, array('error'=>'POST only'));
$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) out(400, array('error'=>'bad request'));

/* ---- image generation (optional) ---- */
if (isset($in['action']) && $in['action'] === 'image') {
  $key = env_val('OPENAI_API_KEY');
  if (!$key) out(200, array('error'=>'no_image_key', 'message'=>'Kein OPENAI_API_KEY in ~/.env — Bild kann nicht generiert werden. Nutze den Prompt manuell in GPT Image 2 / Nano Banana Pro.'));
  $payload = array(
    'model' => 'gpt-image-2',
    'prompt'=> isset($in['prompt']) ? $in['prompt'] : '',
    'size'  => isset($in['size']) ? $in['size'] : '1024x1536',
    'n'     => 1,
  );
  $ch = curl_init('https://api.openai.com/v1/images/generations');
  curl_setopt_array($ch, array(CURLOPT_RETURNTRANSFER=>true, CURLOPT_POST=>true,
    CURLOPT_HTTPHEADER=>array('content-type: application/json','authorization: Bearer '.$key),
    CURLOPT_POSTFIELDS=>json_encode($payload), CURLOPT_TIMEOUT=>300));
  $res = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); $e = curl_error($ch); curl_close($ch);
  if ($res === false) out(502, array('error'=>'upstream: '.$e));
  http_response_code($code ? $code : 200); echo $res; exit;
}

/* ---- story tree + cast storage (server-side JSON) ---- */
if (isset($in['action']) && ($in['action'] === 'tree_load' || $in['action'] === 'tree_save')) {
  $dir = __DIR__ . '/data';
  if (!is_dir($dir)) { @mkdir($dir, 0700, true); @file_put_contents($dir.'/.htaccess', "Require all denied\nDeny from all\n"); }
  $id = isset($in['id']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$in['id']) : 'default';
  if ($id === '') $id = 'default';
  $file = $dir . '/tree_' . substr($id, 0, 64) . '.json';
  if ($in['action'] === 'tree_load') {
    if (is_readable($file)) { echo file_get_contents($file); }
    else { echo json_encode(array('empty'=>true)); }
    exit;
  }
  // tree_save
  $tree = isset($in['tree']) ? $in['tree'] : null;
  if ($tree === null) out(400, array('error'=>'no tree'));
  $ok = @file_put_contents($file, json_encode($tree));
  if ($ok === false) out(500, array('error'=>'write failed (Schreibrechte im data-Ordner?)'));
  out(200, array('ok'=>true, 'bytes'=>$ok));
}

/* ---- default: Anthropic chat / vision ---- */
$key = env_val('ANTHROPIC_API_KEY');
if (!$key) out(500, array('error'=>'Server: ANTHROPIC_API_KEY nicht gefunden. Lege ~/.env mit ANTHROPIC_API_KEY=sk-ant-... an.'));
$payload = array(
  'model'      => isset($in['model']) ? $in['model'] : 'claude-sonnet-4-6',
  'max_tokens' => isset($in['max_tokens']) ? (int)$in['max_tokens'] : 3000,
  'messages'   => isset($in['messages']) ? $in['messages'] : array(),
);
if (!empty($in['system'])) $payload['system'] = $in['system'];
$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, array(CURLOPT_RETURNTRANSFER=>true, CURLOPT_POST=>true,
  CURLOPT_HTTPHEADER=>array('content-type: application/json','x-api-key: '.$key,'anthropic-version: 2023-06-01'),
  CURLOPT_POSTFIELDS=>json_encode($payload), CURLOPT_TIMEOUT=>180));
$res = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); $e = curl_error($ch); curl_close($ch);
if ($res === false) out(502, array('error'=>'upstream: '.$e));
http_response_code($code ? $code : 200); echo $res;
