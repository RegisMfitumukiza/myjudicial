import { describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import { StarRating } from "@/shared/components/star-rating";

afterEach(cleanup);

describe("StarRating", () => {
  it("renders rating with one decimal place", () => {
    render(<StarRating rating={4.5} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("renders integer rating with one decimal place", () => {
    render(<StarRating rating={5} />);
    expect(screen.getByText("5.0")).toBeInTheDocument();
  });

  it("shows review count in parentheses", () => {
    render(<StarRating rating={4} reviewCount={128} />);
    expect(screen.getByText("(128)")).toBeInTheDocument();
  });

  it("hides count when showCount is false", () => {
    render(<StarRating rating={4} reviewCount={128} showCount={false} />);
    expect(screen.queryByText("(128)")).not.toBeInTheDocument();
  });

  it("shows New badge when there are no reviews", () => {
    render(<StarRating rating={null} />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("renders a star icon when rated", () => {
    const { container } = render(<StarRating rating={4} />);
    expect(container.querySelectorAll("svg").length).toBe(1);
  });

  it("renders empty when unrated and showNewBadge is false", () => {
    const { container } = render(
      <StarRating rating={null} showNewBadge={false} />
    );
    expect(screen.queryByText("New")).not.toBeInTheDocument();
    expect(container.querySelectorAll("svg").length).toBe(0);
  });

  it("applies custom className", () => {
    const { container } = render(
      <StarRating rating={4} className="custom-class" />
    );
    expect(container.firstElementChild).toHaveClass("custom-class");
  });
});
