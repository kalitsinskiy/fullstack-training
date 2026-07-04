# Optimistic approach

The reducer in `useOptimistic` takes the committed state and the optimistic value, returns the next "rendered" state. React keeps using this rendered state until the transition that called `removeOptimisticWish` ends.

UI updates immediatelly, because reducer removed the wish object. Once we get the real responce, it's commited to the Wishlist. No manual rollback requires since in case of error the transaction ends without committing the change to Wishlist, so react 'reverts' it.
