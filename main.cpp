#include <iostream>
#include <vector>
#include <fstream>
#include <sstream>
using namespace std;

class Book {
private:
    int bookID;
    string title;
    string author;
    string status;
    int issuedToRegNo;

public:
    Book(int id, string t, string a) {
        bookID = id;
        title = t;
        author = a;
        status = "Available";
        issuedToRegNo = -1;
    }

    int getID() { return bookID; }
    string getTitle() { return title; }
    string getStatus() { return status; }

    void issueBook(int regNo) {
        if (status == "Available") {
            status = "Issued";
            issuedToRegNo = regNo;
            cout << "Book issued successfully\n";
        } else {
            cout << "Error: Book already issued\n";
        }
    }

    void returnBook() {
        if (status == "Issued") {
            status = "Available";
            issuedToRegNo = -1;
            cout << "Book returned successfully\n";
        } else {
            cout << "Error: Book is not issued\n";
        }
    }

    void display() {
        cout << "ID: " << bookID
             << " | Title: " << title
             << " | Author: " << author
             << " | Status: " << status;
        if (status == "Issued")
            cout << " | Issued To: " << issuedToRegNo;
        cout << endl;
    }

    string toFileString() {
        return to_string(bookID) + "," + title + "," + author + "," + status + "," + to_string(issuedToRegNo);
    }
};

class Library {
private:
    vector<Book> books;

public:
    void addBook(int id, string title, string author) {
        for (auto &b : books) {
            if (b.getID() == id) {
                cout << "Error: Duplicate BookID not allowed\n";
                return;
            }
        }
        books.push_back(Book(id, title, author));
        cout << "Book added successfully\n";
        saveToFile();
    }

    void issueBook(int id, int regNo) {
        for (auto &b : books) {
            if (b.getID() == id) {
                if (b.getStatus() == "Available")
                    b.issueBook(regNo);
                else
                    cout << "Error: Book not available\n";
                saveToFile();
                return;
            }
        }
        cout << "Error: Book not found\n";
    }

    void returnBook(int id) {
        for (auto &b : books) {
            if (b.getID() == id) {
                if (b.getStatus() == "Issued")
                    b.returnBook();
                else
                    cout << "Error: Return only if issued\n";
                saveToFile();
                return;
            }
        }
        cout << "Error: Book not found\n";
    }

    void search(string key) {
        bool found = false;
        for (auto &b : books) {
            if (to_string(b.getID()) == key || b.getTitle().find(key) != string::npos) {
                b.display();
                found = true;
            }
        }
        if (!found) cout << "No matching books found\n";
    }

    void showIssued() {
        cout << "\nIssued Books:\n";
        for (auto &b : books) {
            if (b.getStatus() == "Issued")
                b.display();
        }
    }

    void countStatus() {
        int available = 0, issued = 0;
        for (auto &b : books) {
            if (b.getStatus() == "Available") available++;
            else issued++;
        }
        cout << "Available Books: " << available << " | Issued Books: " << issued << endl;
    }

    void showAll() {
        for (auto &b : books)
            b.display();
    }

    void saveToFile() {
        ofstream file("library.txt");
        for (auto &b : books)
            file << b.toFileString() << endl;
        file.close();
    }

    void loadFromFile() {
        ifstream file("library.txt");
        if (!file) return;

        books.clear();
        string line;

        while (getline(file, line)) {
            stringstream ss(line);
            string temp, title, author, status;
            int id, reg;

            getline(ss, temp, ','); id = stoi(temp);
            getline(ss, title, ',');
            getline(ss, author, ',');
            getline(ss, status, ',');
            getline(ss, temp, ','); reg = stoi(temp);

            Book b(id, title, author);
            if (status == "Issued")
                b.issueBook(reg);

            books.push_back(b);
        }
        file.close();
    }
};

int main() {
    Library lib;
    lib.loadFromFile();

    int choice, id, reg;
    string title, author, key;

    while (1) {
        cout << "\n===== Library Management System =====\n";
        cout << "1. Add Book\n";
        cout << "2. Issue Book\n";
        cout << "3. Return Book\n";
        cout << "4. Search Book\n";
        cout << "5. Show Issued Books\n";
        cout << "6. Count Status\n";
        cout << "7. Show All Books\n";
        cout << "8. Exit\n";
        cout << "Enter your choice: ";
        cin >> choice;

        switch (choice) {
            case 1:
                cout << "Enter Book ID: ";
                cin >> id;
                cin.ignore();
                cout << "Enter Title: ";
                getline(cin, title);
                cout << "Enter Author: ";
                getline(cin, author);
                lib.addBook(id, title, author);
                break;

            case 2:
                cout << "Enter Book ID: ";
                cin >> id;
                cout << "Enter Student Reg No: ";
                cin >> reg;
                lib.issueBook(id, reg);
                break;

            case 3:
                cout << "Enter Book ID: ";
                cin >> id;
                lib.returnBook(id);
                break;

            case 4:
                cin.ignore();
                cout << "Enter Book ID or Title: ";
                getline(cin, key);
                lib.search(key);
                break;

            case 5:
                lib.showIssued();
                break;

            case 6:
                lib.countStatus();
                break;

            case 7:
                lib.showAll();
                break;

            case 8:
                lib.saveToFile();
                cout << "Data saved. Exiting...\n";
                return 0;

            default:
                cout << "Invalid choice\n";
        }
    }
}