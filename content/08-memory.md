---
n: 08
title: მეხსიერების მართვა და smart pointers
en: Memory management and smart pointers
eyebrow: მეხსიერება
topics: stack და heap · new/delete · memory leak · unique_ptr · shared_ptr · QGIS-ის მფლობელობის წესები
---

Python-ში მეხსიერებას ნაგვის შემგროვებელი (garbage collector) ასუფთავებს. C++-ში ეს შენი საქმეა. კარგი ამბავი ისაა, რომ თანამედროვე C++-ში ამას smart pointer-ები აკეთებენ.

## stack და heap

| | stack | heap |
|---|---|---|
| რა ინახება | ლოკალური ცვლადები | `new`-ით შექმნილი ობიექტები |
| ვინ ასუფთავებს | ავტომატურად, scope-ის დასრულებისას | პროგრამისტი (ან smart pointer) |
| სიჩქარე | ძალიან სწრაფი | ნელი |
| ზომა | შეზღუდული | დიდი |

::: analogy სასტუმრო და საკუთარი სახლი
stack სასტუმროა: ოთახი ავტომატურად გათავისუფლდება, როცა წახვალ. heap — საკუთარი ბინაა: შენ ვალდებული ხარ, დროზე დააბრუნო ან გაყიდო, თორემ სამუდამოდ დაკავებული დარჩება (memory leak).
:::

## new და delete

```cpp
Polygon *p = new Polygon("Parcel-1");   // heap-ზე შეიქმნა
// ... ვიყენებთ ...
delete p;                                // ხელით უნდა წავშალოთ
```

თუ `delete` დაგავიწყდა, მეხსიერება გაჟონავს (leak). თუ ორჯერ წაშალე ან წაშლის შემდეგ გამოიყენე, პროგრამა დაიმსხვრევა. ხელით `new`/`delete` თანამედროვე კოდში თითქმის აღარ იწერება.

## unique_ptr: ერთადერთი მფლობელი

`std::unique_ptr` ობიექტს ფლობს და scope-ის დასრულებისას ავტომატურად წაშლის.

```cpp unique.cpp
#include <iostream>
#include <memory>
#include <string>
#include <utility>

struct Polygon {
    std::string name;
    explicit Polygon(std::string n) : name(std::move(n)) {
        std::cout << "created " << name << "\n";
    }
    ~Polygon() { std::cout << "destroyed " << name << "\n"; }
};

int main() {
    {
        auto p = std::make_unique<Polygon>("Parcel-1");
        std::cout << "using " << p->name << "\n";
    }
    std::cout << "after scope\n";
    return 0;
}
```

```output
created Parcel-1
using Parcel-1
destroyed Parcel-1
after scope
```

`delete` არსად დაგვიწერია, მაგრამ ობიექტი ზუსტად ბლოკის ბოლოს განადგურდა. ამ პრინციპს RAII ჰქვია: რესურსი ობიექტის სიცოცხლეს ებმება.

## მფლობელობის გადაცემა: std::move

`unique_ptr`-ის კოპირება შეუძლებელია, რადგან მფლობელი ერთია. შეიძლება მხოლოდ გადაცემა.

```cpp
auto a = std::make_unique<Polygon>("Parcel-2");
auto b = std::move(a);          // ახლა b ფლობს, a ცარიელია

if (a == nullptr) {
    std::cout << "a is empty\n";
}
```

```output
created Parcel-2
a is empty
destroyed Parcel-2
```

ბოლო ხაზი პროგრამის დასრულებისას ჩნდება, როცა `b` იშლება.

::: tip QGIS-ში
`std::unique_ptr<QgsAbstractGeometry>` ხშირად გვხვდება: ფუნქცია, რომელიც ახალ გეომეტრიას ქმნის, მის მფლობელობას გვიბრუნებს. ჩანაწერი `std::unique_ptr<...>` ხელმოწერაში ნიშნავს „ეს შენია, შენ უნდა მართო“.
:::

## shared_ptr: ბევრი მფლობელი

როცა ერთ ობიექტს რამდენიმე ადგილი იყენებს, გამოიყენება `std::shared_ptr`. ობიექტი წაიშლება მაშინ, როცა ბოლო მფლობელიც გაქრება (reference counting).

```cpp shared.cpp
#include <iostream>
#include <memory>
#include <string>
#include <utility>

struct Polygon {
    std::string name;
    explicit Polygon(std::string n) : name(std::move(n)) {
        std::cout << "created " << name << "\n";
    }
    ~Polygon() { std::cout << "destroyed " << name << "\n"; }
};

int main() {
    auto a = std::make_shared<Polygon>("Shared");
    std::cout << a.use_count() << "\n";
    {
        auto b = a;
        std::cout << a.use_count() << "\n";
    }
    std::cout << a.use_count() << "\n";
    return 0;
}
```

```output
created Shared
1
2
1
destroyed Shared
```

## რა ხდება QGIS-ში

QGIS-ს საკუთარი მფლობელობის წესები აქვს და დოკუმენტაცია მათ განმარტავს:

| სიტუაცია | წესი |
|---|---|
| `QgsProject::addMapLayer(layer)` | პროექტი იღებს ფენის მფლობელობას და თვითონ წაშლის |
| Qt-ის `QObject` ხე | მშობელი შვილებს თავად წაშლის (იხ. თავი 10) |
| `std::unique_ptr<T>` დაბრუნება | მიმღები მფლობელია |
| მაჩვენებელი `T *` ხელმოწერაში | ჩვეულებრივ მფლობელობა არ გადადის |

::: warn ყურადღება
თუ ფენას `new QgsVectorLayer(...)`-ით ქმნი და პროექტს აძლევ, თავად `delete` აღარ დაწერო. ფენა პროექტის საკუთრებაა და ორმაგი წაშლა პროგრამას დაამსხვრევს.
:::

## სავარჯიშო და შეჯამება

::: exercise სავარჯიშო
1. გადააკეთე თავი 04-ის `Layer rivers{...}` მაგალითი `std::make_unique<Layer>(...)`-ზე.
2. შექმენი `std::vector<std::unique_ptr<Polygon>>` და ჩაამატე სამი მრავალკუთხედი (`push_back(std::make_unique<...>(...))`). რა თანმიმდევრობით წაიშლებიან?
3. შეეცადე `unique_ptr`-ის კოპირებას (`auto b = a;`) და წაიკითხე შეცდომა.
:::

::: summary შეჯამება
- stack ავტომატურია, heap — მფლობელის პასუხისმგებლობა.
- ხელით `new`/`delete` თავიდან აიცილე, გამოიყენე `make_unique` / `make_shared`.
- `unique_ptr` = ერთი მფლობელი, `shared_ptr` = ბევრი.
- QGIS-ში ყოველთვის გაარკვიე, ვინ ფლობს ობიექტს.
:::
