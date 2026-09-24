const isNotFoundError = (error) => error?.name === "NotFoundError";

// Browser translators and a few DOM-manipulating extensions can wrap or move
// text nodes after React has rendered them. React still holds the original
// parent/reference pair, so the next route change can throw NotFoundError
// during insertBefore/removeChild. Keep the app alive when that external
// mutation has already happened.
export function installReactDomMutationGuard() {
  if (typeof Node === "undefined" || Node.prototype.__musifyDomGuardInstalled) {
    return;
  }

  const originalInsertBefore = Node.prototype.insertBefore;
  const originalRemoveChild = Node.prototype.removeChild;

  Object.defineProperty(Node.prototype, "__musifyDomGuardInstalled", {
    value: true,
    configurable: true,
  });

  Node.prototype.insertBefore = function insertBeforeGuard(newNode, referenceNode) {
    try {
      return originalInsertBefore.call(this, newNode, referenceNode);
    } catch (error) {
      if (isNotFoundError(error) && referenceNode && referenceNode.parentNode !== this) {
        return this.appendChild(newNode);
      }
      throw error;
    }
  };

  Node.prototype.removeChild = function removeChildGuard(child) {
    try {
      return originalRemoveChild.call(this, child);
    } catch (error) {
      if (isNotFoundError(error) && child?.parentNode !== this) {
        return child;
      }
      throw error;
    }
  };
}
