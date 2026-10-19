---
n: 06
title: კლასები და ობიექტები
en: Classes and objects
eyebrow: OOP
topics: class და struct · public/private · კონსტრუქტორი · const მეთოდები · QGIS-ის სახელდების წესი
---

QGIS-ში თითქმის ყველაფერი კლასია: `QgsPointXY`, `QgsFeature`, `QgsVectorLayer`. კლასი აერთიანებს **მონაცემს** (წევრ-ცვლადებს) და **ქცევას** (მეთოდებს).

წინა თავში `struct` გავიცანით: ის მხოლოდ მონაცემს აერთიანებს. **კლასი** (class) მას ამატებს ფუნქციებს, რომლებიც ამ მონაცემებზე მუშაობენ. კლასში მოთავსებულ ფუნქციას **მეთოდი** ეწოდება. ობიექტზე ორიენტირებული პროგრამირების (OOP) იდეა ისაა, რომ მონაცემი და მასთან დაკავშირებული ქმედებები ერთად ინახება.

## კლასი და ობიექტი

::: analogy ნახაზი და სახლი
კლასი არის ნახაზი, ობიექტი კი ამ ნახაზით აშენებული სახლი. ერთი ნახაზით შეიძლება ბევრი სახლი აშენდეს: ერთი კლასი `Parcel`, ბევრი კონკრეტული ნაკვეთი.
:::

ქვემოთ ნაკვეთის მარტივი კლასია. თუ Python-ს იცნობ, შეადარე; თუ არა, უბრალოდ გადახედე C++ მხარეს და ქვემოთ დეტალურ ახსნას წაიკითხე:

::: compare
```python
class Parcel:
    def __init__(self, owner, w, h):
        self.owner = owner
        self.w = w
        self.h = h

    def area(self):
        return self.w * self.h
```

```cpp
class Parcel {
public:
  Parcel(std::string owner, double w, double h);
  double area() const;
private:
  std::string mOwner;
  double mW, mH;
};
```
:::

## public და private

`public` წევრებს ყველა ხედავს, `private` წევრებს მხოლოდ თავად კლასის მეთოდები. გარედან `private`-ზე წვდომა კომპილაციის შეცდომაა. ასე ობიექტი საკუთარ მდგომარეობას იცავს: გარე კოდი მას არასწორ მდგომარეობაში ვერ ჩააგდებს (მაგალითად, ვერ ჩაწერს უარყოფით სიგანეს, თუ ამას მეთოდი ამოწმებს).

::: tip QGIS-ის წესი
წევრ-ცვლადებს აქვთ `m` პრეფიქსი (`mOwner`, `mWidth`), მეთოდები კი `get`-ის გარეშეა: `feature.id()`, არა `feature.getId()`. შეცვლისთვის გამოიყენება `set`: `feature.setGeometry(...)`.
:::

## სრული მაგალითი

```cpp parcel.cpp
#include <iostream>
#include <string>
#include <utility>

class Parcel {
public:
    Parcel(std::string owner, double width, double height)
        : mOwner(std::move(owner)), mWidth(width), mHeight(height) {}

    double area() const { return mWidth * mHeight; }
    const std::string &owner() const { return mOwner; }

    void resize(double width, double height) {
        mWidth = width;
        mHeight = height;
    }

private:
    std::string mOwner;
    double mWidth;
    double mHeight;
};

int main() {
    Parcel p("Nino", 20.0, 15.0);
    std::cout << p.owner() << ": " << p.area() << " m2\n";

    p.resize(25.0, 20.0);
    std::cout << p.owner() << ": " << p.area() << " m2\n";
    return 0;
}
```

```output
Nino: 300 m2
Nino: 500 m2
```

ორი ტერმინი: **წევრი ცვლადი** (member variable) არის ობიექტის შიგნით შენახული მონაცემი (`mOwner`, `mWidth`); **წევრი მეთოდი** (member function) არის ფუნქცია, რომელიც ამ მონაცემებზე მუშაობს (`area()`, `resize()`). ობიექტის შექმნისას კონსტრუქტორი ამზადებს წევრ ცვლადებს, ხოლო მეთოდებს შემდეგ სწორედ ამ ობიექტზე ვუძახებთ.

ხაზ-ხაზ:

| კოდი | რას აკეთებს |
|---|---|
| `class Parcel {` | ვქმნით ახალ ტიპს `Parcel` |
| `public:` | აქედან დაწყებული ყველაფერი გარედანაც ხელმისაწვდომია |
| `Parcel(std::string owner, double width, double height)` | **კონსტრუქტორი**: ობიექტის შექმნისას სრულდება და საწყის მნიშვნელობებს უნიშნავს |
| `: mOwner(std::move(owner)), mWidth(width), ...` | წევრების საწყისი მნიშვნელობები; `std::move` ტექსტს კოპირების გარეშე გადასცემს (ამას თავი 08-ში ავხსნით, ამჟამად ისე გადმოწერე, როგორც წერია) |
| `double area() const { ... }` | მეთოდი, რომელიც ფართობს გამოთვლის; ბოლოს `const` ნიშნავს, რომ ობიექტს არ ცვლის |
| `const std::string &owner() const` | მფლობელის სახელს აბრუნებს კოპირების გარეშე |
| `void resize(...)` | ზომას ცვლის |
| `private:` | აქ მოთავსებული წევრები მხოლოდ კლასის შიგნიდან ჩანს |
| `std::string mOwner; double mWidth;...` | ობიექტის მონაცემები |
| `Parcel p("Nino", 20.0, 15.0);` | `main`-ში ვქმნით ობიექტს და კონსტრუქტორს მნიშვნელობებს ვუგზავნით |
| `p.area()` | წერტილით ვუძახებთ ობიექტის მეთოდს |

## კონსტრუქტორი

კონსტრუქტორი არის სპეციალური მეთოდი, რომელიც ობიექტის შექმნისას სრულდება. მას სახელი კლასის სახელი აქვს და დაბრუნების ტიპი არა. წევრებს ვიწყებთ ე.წ. **ინიციალიზაციის სიით** (`: mOwner(...), mWidth(width)`), ეს მიღებული წესია.

```cpp
Parcel p("Nino", 20.0, 15.0);          // ობიექტი შეიქმნა
```

QGIS-ის მაგალითი:

```cpp
QgsPointXY tbilisi(44.8271, 41.7151);   // x = გრძედი(lon), y = განედი(lat)
double x = tbilisi.x();
```

აქ `tbilisi` არის `QgsPointXY` კლასის ობიექტი, კონსტრუქტორს გადავეცით ორი კოორდინატი, შემდეგ მეთოდით `x()` ავიღეთ პირველი.

::: warn გაითვალისწინე
QGIS-ში წერტილი `(x, y)` = `(გრძედი, განედი)`, ანუ `(lon, lat)`. ბევრ რუკის API-ში პირიქითაა. შეცდომა ძალიან გავრცელებულია.
:::

## const მეთოდი

`double area() const` — ბოლოს `const` ნიშნავს, რომ მეთოდი ობიექტს არ ცვლის. ამიტომ ის `const Parcel &`-ზეც გამოიძახება. გახსოვდეს `const QgsFeature &feature`: მასზე მხოლოდ `const` მეთოდები გამოიძახება.

| მეთოდი | `const`? | რატომ |
|---|---|---|
| `area()` | დიახ | მხოლოდ კითხულობს |
| `owner()` | დიახ | მხოლოდ კითხულობს |
| `resize(...)` | არა | ცვლის ობიექტს |

## struct და class

C++-ში `struct` და `class` თითქმის ერთია. ერთადერთი განსხვავება: `struct`-ში წევრები ნაგულისხმევად `public`-ია, `class`-ში `private`. პრაქტიკაში `struct` მარტივ მონაცემებს (`Point`) ვიყენებთ, `class` — ქცევიან ობიექტებს.

## სავარჯიშო და შეჯამება

::: exercise სავარჯიშო
1. დაამატე `Parcel`-ს მეთოდი `double perimeter() const`.
2. დაამატე `bool isLargerThan(const Parcel &other) const`.
3. შექმენი კლასი `Region`, რომელსაც აქვს სახელი და მოსახლეობა, და მეთოდი `density(double areaKm2) const`.
4. შეეცადე `p.mWidth = 5;`-ს `main`-ში და წაიკითხე კომპილატორის შეტყობინება.
:::

::: summary შეჯამება
- კლასი = მონაცემი + მეთოდები; ობიექტი = კლასის კონკრეტული ეგზემპლარი.
- `private` იცავს მდგომარეობას, `public` არის ინტერფეისი.
- QGIS: `mMember`, `name()`, `setName()`.
- `const` მეთოდი ობიექტს არ ცვლის.
:::
