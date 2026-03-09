# ADR 005: Removing `from __future__ import annotations` from Runtime-Inspected Modules

**Status:** Accepted
**Date:** 2026-03-09
**Author:** Agnij Dutta

## Context

Python's `from __future__ import annotations` (PEP 563) converts all type annotations from evaluated expressions to strings. This is useful for reducing import-time overhead and enabling forward references. Our linter (ruff) enforces `TC001` and `TC003` rules that suggest moving type-only imports into `TYPE_CHECKING` blocks, which pairs naturally with PEP 563.

However, several frameworks in our stack inspect annotations at **runtime**:

1. **Pydantic v2** — Model field definitions use annotations to determine types, validators, and serialization behavior. `BaseModel` subclasses call `model_fields` which resolves annotations at class creation time.

2. **SQLAlchemy 2.0 `Mapped[]`** — The new declarative style uses `Mapped[int]`, `Mapped[str]`, etc. SQLAlchemy resolves these annotations at mapper configuration time to determine column types.

3. **FastAPI `Annotated[]` dependencies** — FastAPI uses `Annotated[Session, Depends(get_db)]` to resolve dependency injection at route registration time. These must be real types, not strings.

When `from __future__ import annotations` is active, all three frameworks receive string annotations instead of actual types. They attempt to resolve these strings using `typing.get_type_hints()`, which fails when the referenced types were moved to `TYPE_CHECKING` blocks (since those imports don't exist at runtime).

### The Failure Mode

```python
from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from uuid import UUID

class TenantResponse(BaseModel):
    id: UUID  # This is now the string "UUID", not the UUID class
    # Pydantic: NameError: name 'UUID' is not defined
```

This manifested as cascading `ForwardRef` resolution errors across 20+ files when we initially applied PEP 563 project-wide.

## Decision

**Remove `from __future__ import annotations` from all modules that contain:**
- Pydantic `BaseModel` subclasses (schemas)
- SQLAlchemy `DeclarativeBase` subclasses and models using `Mapped[]`
- FastAPI route handlers using `Annotated[]` dependency injection

**Keep imports at module level** (not in `TYPE_CHECKING` blocks) for types used in annotations in these files.

**Suppress ruff TC001/TC003 warnings** via per-file-ignores in `pyproject.toml`:

```toml
[tool.ruff.lint.per-file-ignores]
"app/db/base.py" = ["TC003"]
"app/db/models/*" = ["TC003"]
"app/api/v1/schemas/*" = ["TC003"]
"app/api/v1/endpoints/*" = ["TC001", "TC003"]
```

## Consequences

### Good

- **Everything works.** Pydantic, SQLAlchemy, and FastAPI can all resolve types at runtime.
- **No fragile workarounds.** We don't need `model_rebuild()`, `update_forward_refs()`, or manual annotation resolution.
- **Clear rule.** If a file has runtime-inspected annotations, it doesn't use PEP 563. Simple to follow.

### Bad

- **Linter exceptions.** We have to maintain per-file-ignores for TC rules. This is a minor maintenance burden.
- **Import-time cost.** Types like `UUID`, `datetime` are imported at module level even when they're only used in annotations. The performance impact is negligible (these are stdlib modules that are cached after first import).
- **Inconsistency.** Some files use PEP 563, others don't. This is a conscious tradeoff — consistency across frameworks matters more than consistency in import style.

### Why Not PEP 649?

PEP 649 (deferred evaluation of annotations) was accepted for Python 3.14 and would resolve this tension — annotations remain as actual types but are only evaluated when accessed. However:

- We target Python 3.11+ for broad compatibility
- PEP 649 isn't available in our deployment runtime
- When we eventually adopt 3.14+, we can revisit this decision

## References

- [PEP 563 — Postponed Evaluation of Annotations](https://peps.python.org/pep-0563/)
- [PEP 649 — Deferred Evaluation of Annotations](https://peps.python.org/pep-0649/)
- [Pydantic v2 documentation on forward references](https://docs.pydantic.dev/latest/concepts/postponed_annotations/)
- [SQLAlchemy 2.0 Mapped Column documentation](https://docs.sqlalchemy.org/en/20/orm/mapped_attributes.html)
