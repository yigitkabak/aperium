# Aperium: Modern Paket Yöneticisi

Aperium, Aperture Labs Ekosistemi'nin bir ürünüdür.

Aperium, yalnızca bir paket yükleyici olmakla kalmayıp, aynı zamanda geliştirdiğiniz özel paketleri kolayca yönetmenizi ve paylaşmanızı sağlayan bir araçtır. Node.js ekosistemindeki paket kurulum sürecini daha verimli, basit ve kullanıcı dostu hale getirmek için tasarlanmıştır, böylece geliştiricilere zaman kazandırır. Aperium, hem harici bağımlılıkları (npm'den indirilen paketler) hem de kendi özel paketlerinizi yüklemenize olanak tanır. Aperium ile sadece popüler açık kaynak paketlerini değil, kendi projelerinizdeki modülleri de kolayca kurabilirsiniz.

Bir paketi Aperium'a yüklemek için GitHub depomuza bir pull request oluşturabilirsiniz.

## Projenin Temel Özellikleri:

Aperium, sadece npm'den paketleri yüklemekle kalmaz, aynı zamanda kendi özel paketlerinizi indirmenize ve projelerinize dahil etmenize olanak tanır. `aper` komutunu kullanarak, geliştirdiğiniz modülleri veya başkalarıyla paylaşmak istediğiniz projeleri kolayca yükleyebilirsiniz.

## Aperium Nasıl Kullanılır:

Aperium, `naper` ve `aper` olmak üzere iki ana komutla çalışır. Bu komutlar farklı amaçlara hizmet eder.

### naper Komutu:
```
naper install <packageName>
```
Bu komut, npm'den harici bağımlılıkları yükler. `express`, `lodash` gibi popüler paketleri yüklemek için bu komutu kullanabilirsiniz.
```
naper install express
```
Bu komut çalıştırıldığında, yalnızca gerekli çıktılar görüntülenir ve gereksiz bilgiler gizlenir. Kurulum tamamlandıktan sonra kullanıcıya bir başarı mesajı gösterilir:
```
🔍 Installing express package... ✅ express has been successfully installed.
```

---

### Aper Komutu:

Aperium'un en güçlü özelliklerinden biri, kullanıcıların kendi özel geliştirdikleri paketleri yüklemelerine olanak sağlamasıdır. `aper` komutu, projenize yalnızca harici bağımlılıkları değil, aynı zamanda kendi geliştirdiğiniz ve paylaştığınız modülleri de dahil etmenizi sağlar.

**Özel bir `.apr` paketini yüklemek için:**
```
aper install <dosyaAdi.apr>
```
Bu komut ile kendi `.apr` paketlerinizi kurabilir ve başkalarıyla paylaşabilirsiniz. Bir modül veya proje geliştirdiğinizde, Aperium'u kullanarak bunu diğer geliştiricilerle kolayca paylaşabilirsiniz.

Bu komut çalıştırıldığında, aşağıdaki süreç gerçekleşir:

* `.apr` paketi açılır ve içeriği analiz edilir.
* Sisteminiz algılanır (örneğin Debian, Arch, NixOS veya bunlara tabanlı bir sistem).
* Paket daha önce yüklenmişse veya mevcut bir kurulum algılanırsa size bilgi verilir.
* İlgili kurulum komut dosyaları (veya NixOS için paket listeleri) çalıştırılır.
* Kurulum çıktısı, paket adını ve başarı mesajını gösterecektir.

**Aperium deposundan şablon yüklemek için:**
```
aper install -r <şablon_adı>
```
Bu komut, Aperium'un varsayılan GitHub deposundan belirli bir şablonu indirip kurmanızı sağlar.
```
aper install -r Synapic
```

**Yeni bir `.apr` paketi oluşturmak için:**
```
aper new <paket_adı>
```
Bu komut, platforma özel (Debian, Arch, NixOS) kurulum komut dosyalarını veya paket listelerini tanımlayabileceğiniz yeni bir `.apr` paketi oluşturmanıza yardımcı olur.

**Bir `.apr` paketinin içeriğini görüntülemek için:**
```
aper view <dosyaAdi.apr>
```
Bu komut, bir `.apr` dosyasının içindeki kurulum komut dosyalarını ve yapılandırmalarını görüntülemenizi sağlar, böylece bir paketi yüklemeden önce ne yaptığını görebilirsiniz.

---

## Aperium'u İndirme ve Kullanma:

İlk olarak, GitHub depomuzu klonlamanız gerekiyor:
```
git clone https://github.com/yigitkabak/aperium
```
Ardından, proje dizinine gidin ve gerekli npm modüllerini yükleyin ve projeyi derleyin:
```
cd aperium
npm install
npm run build
```

Hepsi bu kadar! Artık `aper` komutunu terminalinizden doğrudan kullanabilirsiniz.

---

## Huh Detaylar Sistemi

Aperture Labs'ın başka bir ürünü olan `.huh` dosya uzantısını Aperium aracılığıyla kullanın.

```
huhinfo file.huh
```
Bu komut, `.huh` dosyanızın ayrıntılı bir analizini sunacaktır.

---

Daha fazla bilgi için, sadece terminalinizde `aper help` komutunu kullanabilirsiniz.
