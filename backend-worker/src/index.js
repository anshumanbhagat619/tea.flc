import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Helper to auto-increment serial
async function getNextSerial(db) {
  const counter = await db.prepare("SELECT samples FROM counters WHERE id = 'global'").first();
  const next = (counter?.samples || 0) + 1;
  await db.prepare("UPDATE counters SET samples = ? WHERE id = 'global'").bind(next).run();
  return `QC-${String(next).padStart(5, '0')}`;
}

// Routes
app.get('/api/db', async (c) => {
  const users = await c.env.DB.prepare("SELECT * FROM users").all();
  const parties = await c.env.DB.prepare("SELECT * FROM parties").all();
  const samples = await c.env.DB.prepare("SELECT * FROM samples ORDER BY createdAt DESC").all();
  const counters = await c.env.DB.prepare("SELECT * FROM counters WHERE id = 'global'").first();
  
  return c.json({
    users: users.results || [],
    pendingUsers: (users.results || []).filter(u => u.status === 'pending'),
    parties: parties.results || [],
    samples: samples.results || [],
    counters: { samples: counters?.samples || 0 }
  });
});

app.post('/api/setup', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    "INSERT INTO users (id, userId, password, fullName, role, status) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(id, body.userId, body.password, body.fullName, 'master', 'approved').run();
  return c.json({ success: true, user: { id, userId: body.userId, role: 'master' } });
});

app.post('/api/save-sample', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const isNew = !body.id;
    const serial = body.sampleSerialNo || (await getNextSerial(c.env.DB));

    if (isNew) {
      await c.env.DB.prepare(
        "INSERT INTO samples (id, sampleSerialNo, partyName, vehicleNo, grossLoadedWeight, emptyVehicleWeight, netWeight, flcPercent, moistureDeduction, damagedLeaf, finalCalculatedWeight, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        id, 
        serial, 
        body.partyName || "", 
        body.vehicleNo || "", 
        body.grossLoadedWeight || 0, 
        body.emptyVehicleWeight || 0, 
        body.netWeight || 0, 
        body.flcPercent || 0, 
        body.moistureDeduction || 0, 
        body.damagedLeaf || 0, 
        body.finalCalculatedWeight || 0, 
        body.status || 'pending_qc'
      ).run();
    } else {
      await c.env.DB.prepare(
        "UPDATE samples SET partyName=?, vehicleNo=?, grossLoadedWeight=?, emptyVehicleWeight=?, netWeight=?, flcPercent=?, moistureDeduction=?, damagedLeaf=?, finalCalculatedWeight=?, status=? WHERE id=?"
      ).bind(
        body.partyName || "", 
        body.vehicleNo || "", 
        body.grossLoadedWeight || 0, 
        body.emptyVehicleWeight || 0, 
        body.netWeight || 0, 
        body.flcPercent || 0, 
        body.moistureDeduction || 0, 
        body.damagedLeaf || 0, 
        body.finalCalculatedWeight || 0, 
        body.status, 
        id
      ).run();
    }
    return c.json({ success: true, id, serial });
  } catch (err) {
    console.error(err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/delete-sample', async (c) => {
  const { id } = await c.req.json();
  await c.env.DB.prepare("DELETE FROM samples WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

app.post('/api/register', async (c) => {
  const { userId, password, fullName } = await c.req.json();
  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare(
      "INSERT INTO users (id, userId, password, fullName, role, status) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, userId, password, fullName, 'clerk', 'pending').run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ success: false, message: "USER ID ALREADY EXISTS" });
  }
});

app.post('/api/add-user', async (c) => {
  const { userId, password, fullName, role } = await c.req.json();
  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare(
      "INSERT INTO users (id, userId, password, fullName, role, status) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, userId, password, fullName, role, 'approved').run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ success: false, message: "USER ID ALREADY EXISTS" });
  }
});

app.post('/api/approve-user', async (c) => {
  const { id, role } = await c.req.json();
  await c.env.DB.prepare("UPDATE users SET status = 'approved', role = ? WHERE id = ?").bind(role, id).run();
  return c.json({ success: true });
});

app.post('/api/reject-user', async (c) => {
  const { id } = await c.req.json();
  await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

app.post('/api/update-user-role', async (c) => {
  const { id, role } = await c.req.json();
  await c.env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, id).run();
  return c.json({ success: true });
});

app.post('/api/delete-user', async (c) => {
  const { id } = await c.req.json();
  await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

app.post('/api/add-party', async (c) => {
  const { name } = await c.req.json();
  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare("INSERT INTO parties (id, name) VALUES (?, ?)").bind(id, name).run();
    return c.json({ success: true, id });
  } catch (e) {
    return c.json({ success: false, message: "GARDEN ALREADY EXISTS" });
  }
});

app.post('/api/delete-party', async (c) => {
  const { id } = await c.req.json();
  await c.env.DB.prepare("DELETE FROM parties WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

app.post('/api/reset-db', async (c) => {
  await c.env.DB.prepare("DELETE FROM samples").run();
  await c.env.DB.prepare("DELETE FROM parties").run();
  await c.env.DB.prepare("DELETE FROM users").run();
  await c.env.DB.prepare("UPDATE counters SET samples = 0 WHERE id = 'global'").run();
  return c.json({ success: true });
});

app.post('/api/auth', async (c) => {
  const { userId, password } = await c.req.json();
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE userId = ? AND password = ?").bind(userId, password).first();
  if (user) {
    if (user.status === 'approved') {
      return c.json({ success: true, user });
    }
    return c.json({ success: false, message: "ACCOUNT PENDING APPROVAL" });
  }
  return c.json({ success: false, message: "INVALID CREDENTIALS" });
});

export default app;
