import { test, expect, type Page } from '@playwright/test';
import {
  STAMP,
  createRoom,
  joinRoom,
  openRoomMessages,
  runDraw,
  signIn,
} from './helpers';

/**
 * THE critical-path E2E — one test that exercises the whole stack through a
 * real browser: santa-app → santa-api → Mongo/Redis/RabbitMQ → santa-notifications.
 *
 * Three separate browser contexts, because three separate *sessions* is the
 * point: the owner cannot see the guests' assignments and vice versa. A draw
 * needs at least three participants, so all three sign in and join for real.
 *
 * Keep this suite tiny. Edge cases belong in the component/integration tests —
 * they run in seconds and don't need the stack up.
 */

const ROOM_NAME = `E2E Room ${STAMP}`;

test('sign in → create → join ×2 → draw → assignment → anonymous message', async ({
  browser,
}) => {
  const contexts = await Promise.all([
    browser.newContext(),
    browser.newContext(),
    browser.newContext(),
  ]);
  const [ownerPage, firstGuestPage, secondGuestPage] = await Promise.all(
    contexts.map((context) => context.newPage()),
  );

  try {
    // 1) Three people sign in — three independent sessions.
    await signIn(ownerPage, 'E2E Owner', 'owner');
    await signIn(firstGuestPage, 'E2E Guest One', 'guest-one');
    await signIn(secondGuestPage, 'E2E Guest Two', 'guest-two');

    // 2) The owner creates a room and reads the invite code off the page.
    const inviteCode = await createRoom(ownerPage, ROOM_NAME);

    // 3) Both guests join with that code.
    await joinRoom(firstGuestPage, inviteCode, ROOM_NAME);
    await joinRoom(secondGuestPage, inviteCode, ROOM_NAME);

    // 4) The owner sees all three participants, so the draw is unlocked.
    // Scoped to <main>: the sidebar also shows the signed-in user's name.
    await ownerPage.reload();
    const roomBody = ownerPage.getByRole('main');
    await expect(roomBody.getByText(/3 participants/)).toBeVisible();
    for (const name of ['E2E Owner', 'E2E Guest One', 'E2E Guest Two']) {
      await expect(roomBody.getByText(name, { exact: true })).toBeVisible();
    }

    // Owner-only control — the guests never see it.
    await expect(
      firstGuestPage.getByRole('button', { name: /draw names/i }),
    ).toHaveCount(0);

    // 5) The owner runs the draw.
    await runDraw(ownerPage);
    await expect(ownerPage.getByText(/Status: drawn/)).toBeVisible();

    // 6) Everyone gets a giftee, and nobody drew themselves.
    const gifteeOfOwner = await revealGiftee(ownerPage, 'E2E Owner');
    const gifteeOfFirstGuest = await revealGiftee(firstGuestPage, 'E2E Guest One');
    const gifteeOfSecondGuest = await revealGiftee(secondGuestPage, 'E2E Guest Two');

    // A valid derangement: every participant is gifted exactly once.
    expect(
      [gifteeOfOwner, gifteeOfFirstGuest, gifteeOfSecondGuest].sort(),
    ).toEqual(['E2E Guest One', 'E2E Guest Two', 'E2E Owner']);

    // 7) The owner messages their giftee anonymously, through santa-notifications.
    await openRoomMessages(ownerPage);
    await expect(
      ownerPage.getByRole('tab', { name: new RegExp(gifteeOfOwner) }),
    ).toBeVisible();

    const composer = ownerPage.getByLabel(`Message ${gifteeOfOwner}`);
    await composer.fill('Ho ho ho — any hints on what you would love?');
    await ownerPage.getByRole('button', { name: /^send$/i }).click();

    await expect(
      ownerPage.getByText('Ho ho ho — any hints on what you would love?'),
    ).toBeVisible();

    // 8) The giftee sees it in their anonymous "Your Secret Santa" thread.
    const gifteePage = pageOf(gifteeOfOwner, {
      'E2E Guest One': firstGuestPage,
      'E2E Guest Two': secondGuestPage,
    });
    await openRoomMessages(gifteePage);
    await gifteePage.getByRole('tab', { name: /Your Secret Santa/ }).click();

    await expect(
      gifteePage.getByText('Ho ho ho — any hints on what you would love?'),
    ).toBeVisible();
    // The sender stays anonymous — their display name is nowhere in the thread.
    await expect(
      gifteePage.getByRole('main').getByText('E2E Owner'),
    ).toHaveCount(0);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});

/** Read a participant's giftee off the room page, asserting it is not themselves. */
async function revealGiftee(page: Page, self: string): Promise<string> {
  await page.reload();
  const receiver = page.getByTestId('assignment-receiver');
  await expect(receiver).toBeVisible();

  const giftee = (await receiver.innerText()).trim();
  expect(giftee).not.toBe(self);
  expect(giftee).not.toBe('');
  return giftee;
}

/** The owner's giftee is one of the two guests — pick that guest's page. */
function pageOf(displayName: string, pages: Record<string, Page>): Page {
  const page = pages[displayName];
  if (!page) throw new Error(`No page for ${displayName}`);
  return page;
}
