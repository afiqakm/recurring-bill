"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, Chip } from "@heroui/react";


import styles from "./Categories.module.css";

type CategoryRow = {
  id: string;
  name: string;
  itemCount: number;
  transactionCount: number;
};

type CategoriesResponse = {
  categories: CategoryRow[];
  total: number;
};

async function readCategories(): Promise<CategoriesResponse> {
  const response = await fetch("/api/categories", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load categories");
  }
  return response.json();
}

export function Categories() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    readCategories()
      .then((result) => {
        setRows(result.categories);
        setTotal(result.total);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Failed to load"));
  }, []);

  return (
    <main className={styles.page}>
      <Card className={styles.count}>
        <h1>Categories</h1>
        <Chip color="accent" variant="soft">
          {total}
        </Chip>
      </Card>

      <Card className={styles.panel}>
        <CardContent>
          {message ? <p className={styles.message}>{message}</p> : null}

          <div className={styles.mobileList}>
            {rows.map((row) => (
              <Card key={row.id} className={styles.card}>
                <CardContent>
                  <div className={styles.cardHead}>
                    <strong>{row.name}</strong>
                  </div>
                  <p>Items: {row.itemCount}</p>
                  <p>Transactions: {row.transactionCount}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Items</th>
                <th>Transactions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.itemCount}</td>
                  <td>{row.transactionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
