import { hash } from '@node-rs/argon2';
import { db, pool, usersTable } from '@workspace/db';
import { and, eq, ne } from 'drizzle-orm';

const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
const password = process.env.OWNER_PASSWORD;
const firstName = process.env.OWNER_FIRST_NAME?.trim() || 'Owner';
const lastName = process.env.OWNER_LAST_NAME?.trim() || null;

if (!email || !email.includes('@')) {
  throw new Error('OWNER_EMAIL must contain a valid email address.');
}

if (!password || password.length < 12) {
  throw new Error('OWNER_PASSWORD must contain at least 12 characters.');
}

const passwordHash = await hash(password, {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
});

try {
  const [conflictingOwner] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(and(eq(usersTable.role, 'owner'), ne(usersTable.email, email)))
    .limit(1);

  if (conflictingOwner) {
    throw new Error(
      `An owner already exists for ${conflictingOwner.email ?? conflictingOwner.id}.`,
    );
  }

  const [existingUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existingUser) {
    await db
      .update(usersTable)
      .set({
        passwordHash,
        firstName,
        lastName,
        role: 'owner',
        status: 'active',
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, existingUser.id));

    console.log(`Owner credentials updated for ${email}.`);
  } else {
    await db.insert(usersTable).values({
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'owner',
      status: 'active',
    });

    console.log(`Owner created for ${email}.`);
  }
} finally {
  await pool.end();
}
