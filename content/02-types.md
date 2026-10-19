---
n: 02
title: ტიპები და ცვლადები
en: Types and variables
eyebrow: საფუძვლები
topics: int · double · bool · auto · const · ტიპების გარდაქმნა · კოორდინატები და სიზუსტე
---

Python-ში `x = 5` საკმარისია. C++-ში კომპილატორს წინასწარ უნდა ეცოდინებოდეს, რა სახის მონაცემია ცვლადში. ამიტომ QGIS-ის დოკუმენტაციაში ყველგან ტიპები წერია.

## ცვლადი როგორც ეტიკეტიანი ყუთი

::: analogy ყუთი და ეტიკეტი
Python-ში ყუთს არ აქვს ფორმა: ერთსა და იმავე ყუთში ჯერ რიცხვს ჩადებ, მერე ტექსტს. C++-ში ყუთი კონკრეტული ფორმისაა: `int`-ის ყუთში მხოლოდ მთელი რიცხვი ჯდება, `double`-ის ყუთში ათწილადი. ეს იმიტომაა მკაცრი, რომ კომპიუტერმა წინასწარ იცოდეს, რამდენ მეხსიერებას დაიკავებს.
:::

::: compare
```python
lat = 41.7151
vertex_count = 12
is_valid = True
```

```cpp
double lat = 41.7151;
int vertexCount = 12;
bool isValid = true;
```
:::

## ძირითადი ტიპები

| ტიპი | რას ინახავს | გეო-მაგალითი |
|---|---|---|
| `int` | მთელი რიცხვი | `int vertexCount = 12;` |
| `double` | ათწილადი (ზუსტი) | `double lat = 41.7151;` |
| `bool` | `true` / `false` | `bool isValid = true;` |
| `char` | ერთი სიმბოლო | `char hemisphere = 'N';` |
| `std::string` | ტექსტი | `std::string city = "Batumi";` |
| `qint64` (Qt) | დიდი მთელი რიცხვი | ფენაში მილიონობით ობიექტი |

::: tip კოორდინატებისთვის
კოორდინატებს ყოველთვის `double`-ში ვინახავთ. QGIS-ის `QgsPointXY` შიგნით სწორედ ორ `double`-ს შეიცავს.
:::

## კოდი შედეგით

```cpp coords.cpp
#include <iostream>

int main() {
    double lat = 41.7151;
    double lon = 44.8271;
    int vertexCount = 12;
    bool isValid = true;

    std::cout << "Tbilisi: " << lat << ", " << lon << "\n";
    std::cout << "Vertices: " << vertexCount << "\n";
    std::cout << std::boolalpha << "Valid: " << isValid << "\n";
    return 0;
}
```

```output
Tbilisi: 41.7151, 44.8271
Vertices: 12
Valid: true
```

`std::boolalpha` გვაიძულებს, `bool` გამოვიტანოთ სიტყვებით. მის გარეშე დაიბეჭდებოდა `1`.

## const და auto

`const` ნიშნავს, რომ მნიშვნელობას შემდეგ აღარ შევცვლით. `auto` კომპილატორს უთხრებს, რომ ტიპი თვითონ გამოიცნოს მარჯვენა მხარიდან.

```cpp
const double EARTH_RADIUS_KM = 6371.0;   // არ იცვლება
auto area = 50.0;                         // double
auto count = 12;                          // int
```

::: warn ყურადღება
`const` ცვლადს მნიშვნელობა მხოლოდ შექმნისას ეძლევა. მოგვიანებით ცვლილების მცდელობა კომპილაციის შეცდომას იძლევა და ეს კარგია: შეცდომა კოდის გაშვებამდე ჩანს.
:::

## მთელი რიცხვების გაყოფა

ეს პირველი ხაფანგია Python-იდან მოსულებისთვის.

```cpp division.cpp
#include <iostream>

int main() {
    int totalHectares = 7;
    int parcels = 2;

    std::cout << totalHectares / parcels << "\n";
    std::cout << totalHectares / 2.0 << "\n";
    return 0;
}
```

```output
3
3.5
```

ორი `int`-ის გაყოფა `int`-ს იძლევა და წილადი ნაწილი იკარგება (Python-ში `7 / 2` იყო `3.5`, ხოლო `7 // 2` — `3`). თუ ერთი მხარე `double`-ა, შედეგიც `double` იქნება.

## სიზუსტე და გარდაქმნა

ათწილადებს ზუსტად ვერ ვადარებთ ერთმანეთს `==`-ით, რადგან კომპიუტერი ორობით სისტემაში ინახავს.

```cpp precision.cpp
#include <iostream>
#include <cmath>

int main() {
    double a = 0.1 + 0.2;
    std::cout << std::boolalpha;
    std::cout << (a == 0.3) << "\n";
    std::cout << (std::abs(a - 0.3) < 1e-9) << "\n";

    int whole = static_cast<int>(3.99);
    std::cout << whole << "\n";
    return 0;
}
```

```output
false
true
3
```

::: tip წესი
ათწილადები ვადარო სიზუსტით (`abs(a - b) < epsilon`). `static_cast<int>(...)` აკეთებს აშკარა გარდაქმნას და ათწილადი ნაწილი უბრალოდ იკვეთება.
:::

## სავარჯიშო და შეჯამება

::: exercise სავარჯიშო
1. გამოაცხადე ცვლადები ბათუმისთვის: განედი `41.6168`, გრძედი `41.6367`, მოსახლეობა `int`-ად (მიახლოებით 170000). გამოიტანე ისინი.
2. წარმოიდგინე 5 ნაკვეთი, საერთო ფართობი 12 ჰექტარი. გამოთვალე საშუალო ფართობი სწორად (`double`).
3. რას დაბეჭდავს `static_cast<int>(-2.7)`? შეამოწმე.
:::

::: summary შეჯამება
- ტიპი ცვლადის „ყუთის ფორმაა“: `int`, `double`, `bool`.
- კოორდინატები — `double`, რაოდენობები — `int` ან `qint64`.
- `int / int` იძლევა `int`-ს.
- ათწილადებს ვადარებთ ზღვრით, არა `==`-ით.
:::
