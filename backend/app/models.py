"""The database tables.

The rule that shapes everything here: **every fact points at a source**. A representative's
name and party come from an election result, each extra fact about them carries its own
source, and every law section belongs to an act whose official text is linked. `source_id` is
never optional, so the database itself refuses an unsourced fact.
"""

from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Computed,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Source(Base):
    """Where a fact came from: an official page, dataset or document."""

    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    title: Mapped[str] = mapped_column(Text)
    publisher: Mapped[str] = mapped_column(Text)
    url: Mapped[str] = mapped_column(Text)
    # When the source itself was published (an election result's declaration date, say).
    published_on: Mapped[date | None] = mapped_column(Date)
    note: Mapped[str | None] = mapped_column(Text)


class Constituency(Base):
    """A seat: a Lok Sabha constituency (elects an MP) or a Vidhan Sabha one (elects an MLA)."""

    __tablename__ = "constituencies"
    __table_args__ = (CheckConstraint("house IN ('lok_sabha', 'vidhan_sabha')", name="house_known"),)

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    house: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(Text)
    state: Mapped[str] = mapped_column(Text)
    reserved_for: Mapped[str | None] = mapped_column(String(10))  # "SC" or "ST" when reserved
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"))
    # Why the seat has no member, when the official list says ("Previous member died").
    vacancy: Mapped[str | None] = mapped_column(Text)

    representative: Mapped["Representative | None"] = relationship(back_populates="constituency")


class Pincode(Base):
    """A postal PIN code area, as India Post lists it."""

    __tablename__ = "pincodes"

    pin: Mapped[str] = mapped_column(String(6), primary_key=True)
    area: Mapped[str] = mapped_column(Text)
    district: Mapped[str] = mapped_column(Text)
    state: Mapped[str] = mapped_column(Text)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"))

    links: Mapped[list["PincodeConstituency"]] = relationship(order_by="PincodeConstituency.constituency_id")


class PincodeConstituency(Base):
    """Which seats a PIN area falls in. One PIN can straddle several seats, so this is a list."""

    __tablename__ = "pincode_constituencies"

    pin: Mapped[str] = mapped_column(ForeignKey("pincodes.pin", ondelete="CASCADE"), primary_key=True)
    constituency_id: Mapped[str] = mapped_column(ForeignKey("constituencies.id"), primary_key=True)
    # True when the PIN area lies partly in this seat and partly in another.
    partial: Mapped[bool] = mapped_column(default=False)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"))

    constituency: Mapped[Constituency] = relationship()


class Representative(Base):
    """The person currently holding a seat. Name, party and election come from `source_id`."""

    __tablename__ = "representatives"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    constituency_id: Mapped[str] = mapped_column(ForeignKey("constituencies.id"), unique=True)
    name: Mapped[str] = mapped_column(Text)
    party: Mapped[str] = mapped_column(Text)
    elected_in: Mapped[str] = mapped_column(Text)  # "General Election 2024"
    # The day the result was declared. Unknown (None) when the source is a list of sitting members.
    elected_on: Mapped[date | None] = mapped_column(Date)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"))

    constituency: Mapped[Constituency] = relationship(back_populates="representative")
    source: Mapped[Source] = relationship()
    facts: Mapped[list["RepresentativeFact"]] = relationship(order_by="RepresentativeFact.position")
    record: Mapped["MemberRecord | None"] = relationship()


class RepresentativeFact(Base):
    """One more fact about a representative, with its own source and date."""

    __tablename__ = "representative_facts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    representative_id: Mapped[str] = mapped_column(ForeignKey("representatives.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(Integer)
    label: Mapped[str] = mapped_column(Text)
    value: Mapped[str] = mapped_column(Text)
    as_of: Mapped[date | None] = mapped_column(Date)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"))

    source: Mapped[Source] = relationship()


class MemberRecord(Base):
    """An MP's record in office: questions asked, attendance, and their MPLADS fund.

    Each number is stored with the average for all MPs, worked out when the data is loaded, so
    every page shows it in context. The numbers are never combined into a score or a ranking.
    """

    __tablename__ = "member_records"

    representative_id: Mapped[str] = mapped_column(
        ForeignKey("representatives.id", ondelete="CASCADE"), primary_key=True
    )
    as_of: Mapped[date] = mapped_column(Date)

    questions: Mapped[int] = mapped_column(Integer)
    questions_average: Mapped[float] = mapped_column(Float)
    questions_source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"))

    # Both NULL when no attendance is recorded: ministers and the Speaker don't sign the register.
    days_signed: Mapped[int | None] = mapped_column(Integer)
    sitting_days: Mapped[int | None] = mapped_column(Integer)
    attendance_average: Mapped[float] = mapped_column(Float)  # percent, over MPs who sign
    attendance_source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"))

    # All NULL when the MP couldn't be matched on the MPLADS dashboard.
    fund_allocated: Mapped[int | None] = mapped_column(BigInteger)  # rupees
    fund_spent: Mapped[int | None] = mapped_column(BigInteger)
    works_recommended: Mapped[int | None] = mapped_column(Integer)
    works_sanctioned: Mapped[int | None] = mapped_column(Integer)
    works_completed: Mapped[int | None] = mapped_column(Integer)
    fund_spent_average: Mapped[float] = mapped_column(Float)  # percent of the allocation spent
    fund_source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"))

    questions_source: Mapped[Source] = relationship(foreign_keys=[questions_source_id])
    attendance_source: Mapped[Source] = relationship(foreign_keys=[attendance_source_id])
    fund_source: Mapped[Source] = relationship(foreign_keys=[fund_source_id])


class Act(Base):
    """A law: the Constitution, or an Act of Parliament."""

    __tablename__ = "acts"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    title: Mapped[str] = mapped_column(Text)
    short_name: Mapped[str] = mapped_column(Text)
    year: Mapped[int] = mapped_column(Integer)
    citation: Mapped[str] = mapped_column(Text)  # "Act No. 22 of 2005"
    unit: Mapped[str] = mapped_column(String(10))  # what its parts are called: "Article" or "Section"
    summary: Mapped[str] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"))

    source: Mapped[Source] = relationship()
    sections: Mapped[list["LawSection"]] = relationship(back_populates="act", order_by="LawSection.position")


# What full-text search looks at, and how much each part counts: a word in the number, title or
# keywords (A) beats one in the plain summary (B), which beats one in the official text (C).
SEARCH_DOCUMENT = (
    "setweight(to_tsvector('simple', number), 'A') || "
    "setweight(to_tsvector('english', title), 'A') || "
    "setweight(to_tsvector('english', keywords), 'A') || "
    "setweight(to_tsvector('english', summary), 'B') || "
    "setweight(to_tsvector('english', coalesce(official_text, '')), 'C')"
)


class LawSection(Base):
    """One section of an act (or one article of the Constitution)."""

    __tablename__ = "law_sections"
    __table_args__ = (
        UniqueConstraint("act_id", "number"),
        Index("law_sections_search", "search", postgresql_using="gin"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    act_id: Mapped[str] = mapped_column(ForeignKey("acts.id", ondelete="CASCADE"))
    number: Mapped[str] = mapped_column(String(20))  # "6", "2(f)", "21A"
    position: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(Text)
    # Our own plain-language summary. Always shown as a summary, never as the law itself.
    summary: Mapped[str] = mapped_column(Text)
    # Everyday words people use for this ("police", "bribe", "refund"), space separated.
    keywords: Mapped[str] = mapped_column(Text, default="")
    # The official wording, once the data pipeline has copied it from the official source.
    official_text: Mapped[str | None] = mapped_column(Text)
    search: Mapped[str] = mapped_column(TSVECTOR, Computed(SEARCH_DOCUMENT, persisted=True))

    act: Mapped[Act] = relationship(back_populates="sections")


class OldCode(Base):
    """A criminal law the BNS, BNSS or BSA replaced (IPC, CrPC, Evidence Act), for the old-to-new lookup."""

    __tablename__ = "old_codes"

    code: Mapped[str] = mapped_column(String(10), primary_key=True)  # "ipc"
    name: Mapped[str] = mapped_column(Text)  # "Indian Penal Code, 1860"
    short_name: Mapped[str] = mapped_column(Text)  # "IPC"
    aliases: Mapped[str] = mapped_column(Text)  # what people call it, "|" separated: "ipc|indian penal code"
    new_act_id: Mapped[str] = mapped_column(ForeignKey("acts.id", ondelete="CASCADE"))
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"))
    position: Mapped[int] = mapped_column(Integer)

    new_act: Mapped[Act] = relationship()
    source: Mapped[Source] = relationship()
    sections: Mapped[list["OldSection"]] = relationship(
        back_populates="old_code", order_by="OldSection.position"
    )


class OldSection(Base):
    """One old section and the section that replaced it, as the official correspondence table gives it."""

    __tablename__ = "old_sections"
    __table_args__ = (UniqueConstraint("code", "number"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(ForeignKey("old_codes.code", ondelete="CASCADE"))
    number: Mapped[str] = mapped_column(String(20))  # "420", "154(3)"
    new_number: Mapped[str | None] = mapped_column(String(20))  # "318(4)"; NULL when not carried over
    title: Mapped[str] = mapped_column(Text)
    note: Mapped[str | None] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer)

    old_code: Mapped[OldCode] = relationship(back_populates="sections")


class DataVersion(Base):
    """A fingerprint of the data files last loaded, so a restart skips reloading unchanged data."""

    __tablename__ = "data_versions"

    name: Mapped[str] = mapped_column(String(40), primary_key=True)
    digest: Mapped[str] = mapped_column(String(64))
    loaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AssistantRun(Base):
    """One question put to the rights assistant: how it was answered and what it cost.

    The question itself is deliberately not stored. People describe their own troubles here
    (an arrest, a violent home), and a record we don't keep can't leak.
    """

    __tablename__ = "assistant_runs"
    __table_args__ = (
        CheckConstraint("mode IN ('ai', 'demo', 'off')", name="assistant_runs_mode"),
        Index("assistant_runs_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # ai = answered live by Claude, demo = a prepared sample replayed, off = AI switched off.
    mode: Mapped[str] = mapped_column(String(8))
    # answered, or what went wrong ("error", "refusal", "too_long").
    outcome: Mapped[str] = mapped_column(String(16))
    rounds: Mapped[int] = mapped_column(Integer, default=0)
    tool_calls: Mapped[int] = mapped_column(Integer, default=0)
    input_tokens: Mapped[int] = mapped_column(Integer, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0)
    # Sections the answer cited that the assistant had read, so were checked and kept.
    citations: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    # Citations the AI wrote but hadn't read, which were taken out before showing the answer.
    dropped_citations: Mapped[int] = mapped_column(Integer, default=0)
