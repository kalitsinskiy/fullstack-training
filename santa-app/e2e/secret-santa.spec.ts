import { test, expect } from '@playwright/test';
import { STAMP, newSession, roomIdFrom, type Session } from './helpers';

test('create -> join x2 -> draw -> assignment -> anonymous message', async ({
  browser,
}) => {
  const sessions: Session[] = [];

  try {
    // Init users
    const owner = await newSession(browser, 'Owner', 'owner');
    const guestA = await newSession(browser, 'Guest A', 'guest-a');
    const guestB = await newSession(browser, 'Guest B', 'guest-b');

    sessions.push(owner, guestA, guestB);

    // Owner - Create room
    const roomName = `E2E Room ${STAMP}`;

    await owner.page.getByRole('button', { name: /new room/i }).click();
    await owner.page.getByLabel('Room name').fill(roomName);
    await owner.page
      .getByRole('dialog')
      .getByRole('button', { name: /^create$/i })
      .click();

    await expect(owner.page).toHaveURL(/\/rooms\/[a-f0-9]{24}$/);

    const roomId = roomIdFrom(owner.page);
    const code = (
      await owner.page.getByTestId('invite-code').innerText()
    ).trim();

    expect(code).toMatch(/^[A-Z0-9]{6}$/);

    // Guests - Join the Room
    for (const guest of [guestA, guestB]) {
      await guest.page.getByRole('button', { name: /^join$/i }).click();

      const dialog = guest.page.getByRole('dialog');

      await dialog.getByLabel('Invite code').fill(code);
      await dialog.getByRole('button', { name: /^join$/i }).click();

      await expect(guest.page).toHaveURL(new RegExp(`rooms/${roomId}`));
      await expect(
        guest.page.getByRole('heading', { name: roomName }),
      ).toBeVisible();
    }

    // Owner - run the draw
    await owner.page.reload();
    await expect(owner.page.getByText('Guest A')).toBeVisible();
    await expect(owner.page.getByText('Guest B')).toBeVisible();

    const drawButton = owner.page.getByRole('button', { name: /draw names/i });

    await expect(drawButton).toBeEnabled();
    await drawButton.click();

    const drawDialog = owner.page.getByRole('dialog');

    await drawDialog.getByRole('button', { name: /^Today,/ }).click();
    await drawDialog.getByRole('button', { name: /draw names/i }).click();
    await expect(owner.page.getByText(/the draw is done/i)).toBeVisible();

    const receiver = (
      await owner.page.getByTestId('assignment-receiver').innerText()
    ).trim();

    expect(['Guest A', 'Guest B']).toContain(receiver);

    // Anonymous messages
    await owner.page
      .getByRole('button', { name: /send an anonymous message/i })
      .click();

    await expect(owner.page).toHaveURL(new RegExp(`/rooms/${roomId}/messages`));

    const secret = `ho ho ho ${STAMP}`;

    await owner.page.getByRole('textbox', { name: 'Message' }).fill(secret);
    await owner.page.getByRole('button', { name: /send message/i }).click();

    await expect(owner.page.getByText(secret)).toBeVisible();

    const recipient = receiver === 'Guest A' ? guestA : guestB;

    await recipient.page.goto(`/rooms/${roomId}/messages`);
    await recipient.page
      .getByRole('button', { name: /your secret santa/i })
      .click();

    await expect(recipient.page.getByText(secret)).toBeVisible();
    await expect(
      recipient.page.getByRole('button', { name: /your secret santa/i }),
    ).toBeVisible();

    const wish = `Hello, Santa ${STAMP}`;

    await recipient.page.getByRole('textbox', { name: 'Message' }).fill(wish);
    await recipient.page.getByRole('button', { name: /send message/i }).click();

    await expect(recipient.page.getByText(wish)).toBeVisible();
    await expect(
      owner.page.getByLabel(/notifications/i).getByText(wish),
    ).toBeVisible();

    await expect(owner.page.getByRole('main').getByText(wish)).toBeVisible();
  } finally {
    await Promise.all(sessions.map((s) => s.close()));
  }
});
