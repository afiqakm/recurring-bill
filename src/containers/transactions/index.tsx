"use client";

import { useEffect, useState } from "react";

import { Button, Card, CardContent, CardHeader, Chip, Input, Spinner } from "@heroui/react";

import styles from "./Transactions.module.css";

type Transaction = {
  id: string;
  itemName: string;
  category: string;
  month: string;
  amount: number;
  dueDay: number | null;
  paid: string | null;
};

type CategorySummary = {
  id: string;
  name: string;
};

type TransactionsResponse = {
  transactions: Transaction[];
  total: number;
};

type CategoriesResponse = {
  categories: CategorySummary[];
};

async function readTransactions(params: { search?: string; category?: string; month?: string }) {
  const url = new URL("/api/transactions", window.location.origin);
  if (params.search) {
    url.searchParams.set("search", params.search);
  }
  if (params.category) {
    url.searchParams.set("category", params.category);
  }
  if (params.month) {
    url.searchParams.set("month", params.month);
  }
  url.searchParams.set("limit", "500");

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load transactions");
  }
  return (await response.json()) as TransactionsResponse;
}

async function readCategories() {
  const response = await fetch("/api/categories", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load categories");
  }
  return (await response.json()) as CategoriesResponse;
}

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      const [txResult, categoryResult] = await Promise.all([
        readTransactions({ search: search || undefined, category: category || undefined, month: month || undefined }),
        readCategories(),
      ]);
      setTransactions(txResult.transactions);
      setTotal(txResult.total);
      setCategories(categoryResult.categories);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, month]);

  return (
    <main className={styles.page}>
      <Card className={styles.count}>
          <h1>Transactions</h1>
          <Chip color="accent" variant="soft">
            {total}
          </Chip>
      </Card>

      <Card className={styles.panel}>
        <CardHeader>
          <h2>Filters</h2>
        </CardHeader>
        <CardContent>
          <div className={styles.row}>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className={styles.nativeSelect}>
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            <Input value={month} onChange={(event) => setMonth(event.target.value)} placeholder="Month (e.g Jan-2026)" />
            <Button variant="primary" onClick={() => load().catch(() => undefined)}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={styles.panel}>
        <CardHeader className={styles.panelTitle}>
          {loading ? <Spinner size="sm" /> : null}
        </CardHeader>
        <CardContent>
          {message ? <p className={styles.message}>{message}</p> : null}

          <div className={styles.mobileList}>
            {transactions.map((txn) => (
              <Card key={txn.id} className={styles.card}>
                <CardContent>
                  <div className={styles.cardHead}>
                    <strong>{txn.itemName}</strong>
                    <Chip size="sm" variant="soft">
                      {txn.category}
                    </Chip>
                  </div>
                  <p>Month: {txn.month}</p>
                  <p>Amount: RM {txn.amount.toFixed(2)}</p>
                  <p>Due Day: {txn.dueDay ?? "-"}</p>
                  <p>Paid: {txn.paid ?? "-"}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Month</th>
                <th>Name</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Paid</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id}>
                  <td>{txn.month}</td>
                  <td>{txn.itemName}</td>
                  <td>{txn.category}</td>
                  <td>RM {txn.amount.toFixed(2)}</td>
                  <td>{txn.paid ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
